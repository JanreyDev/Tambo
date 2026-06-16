<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Fetches Philippine barangay boundary polygons from OpenStreetMap Nominatim
 * and stores the GeoJSON on the barangays table.
 *
 * Public endpoint, no API key. Rate limit: 1 request/sec per IP. Always sends
 * a User-Agent header per Nominatim ToS.
 *
 * Used by:
 * - BarangayObserver (on creation, fires once at onboarding)
 * - BarangaySettingsController::refreshBoundary (admin manual re-fetch)
 */
class BoundaryFetcherService
{
    private const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

    private const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

    private const USER_AGENT = 'BCMP-kapitan.ph (support@primex.ventures)';

    /**
     * Minimum bbox area in square degrees to accept as a real barangay boundary.
     * A real Philippine barangay covers ~0.1 km² at minimum (~9e-6 sq degrees).
     * Anything smaller is almost certainly a POI (school, hall, etc.), not a boundary.
     */
    private const MIN_BBOX_AREA = 1e-6;

    /**
     * Try to fetch the barangay boundary polygon. Tries strategies in order:
     * 1. Overpass — admin_level=10 with strict name + city match (most accurate)
     * 2. Nominatim — featuretype-filtered query, accept only admin boundaries (class=boundary)
     * 3. Nominatim — free-text fallback, reject POI-sized polygons
     */
    public function fetchAndStore(Barangay $barangay): bool
    {
        // Strategy 1: Overpass — admin boundary at level 10 (barangay)
        $geojson = $this->queryOverpass($barangay);
        $source = 'overpass';

        // Strategy 2: Nominatim free-text with boundary filter
        if ($geojson === null) {
            foreach ($this->buildQueries($barangay) as $query) {
                $geojson = $this->queryNominatim($query, requireAdminBoundary: true);
                if ($geojson !== null) {
                    $source = 'nominatim';
                    break;
                }
            }
        }

        // Strategy 3: Nominatim relaxed (accept any polygon big enough to plausibly be a barangay)
        if ($geojson === null) {
            foreach ($this->buildQueries($barangay) as $query) {
                $geojson = $this->queryNominatim($query, requireAdminBoundary: false);
                if ($geojson !== null) {
                    $source = 'nominatim';
                    break;
                }
            }
        }

        if ($geojson === null) {
            Log::info('Barangay boundary not found in OSM', [
                'barangay_id' => $barangay->id,
                'name' => $barangay->name,
                'city' => $barangay->city_municipality,
            ]);

            return false;
        }

        $updates = [
            'boundary_geojson' => $geojson,
            'boundary_fetched_at' => now(),
            'boundary_source' => $source,
        ];

        // Auto-derive barangay center from polygon bbox if not already set.
        // The Map page uses fitBounds(boundary) anyway, but the lat/lng is the
        // canonical center for other surfaces (resident pin picker default,
        // SMS area code, etc.) so we keep it in sync.
        if ($barangay->latitude === null || $barangay->longitude === null) {
            $centroid = $this->polygonBboxCenter($geojson);
            if ($centroid !== null) {
                $updates['latitude'] = $centroid['lat'];
                $updates['longitude'] = $centroid['lng'];
            }
        }

        $barangay->forceFill($updates)->save();

        Log::info('Barangay boundary fetched', [
            'barangay_id' => $barangay->id,
            'source' => $source,
            'auto_centroid' => isset($updates['latitude']),
        ]);

        return true;
    }

    /**
     * Compute the bbox center across all outer rings in the GeoJSON.
     * Used to auto-derive a barangay center coordinate when onboarding skipped it.
     *
     * @param  array<string,mixed>  $geojson  FeatureCollection
     * @return array{lat: float, lng: float}|null
     */
    private function polygonBboxCenter(array $geojson): ?array
    {
        $features = $geojson['features'] ?? [];
        if (empty($features)) {
            return null;
        }

        $allLats = [];
        $allLngs = [];

        foreach ($features as $feature) {
            $geom = $feature['geometry'] ?? null;
            if (! $geom) {
                continue;
            }

            $outerRings = [];
            if ($geom['type'] === 'Polygon') {
                $outerRings = [$geom['coordinates'][0] ?? null];
            } elseif ($geom['type'] === 'MultiPolygon') {
                foreach ($geom['coordinates'] as $polygon) {
                    $outerRings[] = $polygon[0] ?? null;
                }
            }

            foreach ($outerRings as $ring) {
                if (! is_array($ring)) {
                    continue;
                }
                foreach ($ring as $pt) {
                    if (! is_array($pt) || count($pt) < 2) {
                        continue;
                    }
                    $allLngs[] = (float) $pt[0];
                    $allLats[] = (float) $pt[1];
                }
            }
        }

        if (empty($allLats) || empty($allLngs)) {
            return null;
        }

        return [
            'lat' => (min($allLats) + max($allLats)) / 2,
            'lng' => (min($allLngs) + max($allLngs)) / 2,
        ];
    }

    /**
     * Build a ranked list of search queries from most specific to least.
     * Falls through if Nominatim doesn't return a polygon for the first one.
     */
    private function buildQueries(Barangay $barangay): array
    {
        $name = trim((string) $barangay->name);
        $city = trim((string) $barangay->city_municipality);
        $province = trim((string) $barangay->province);

        $queries = [];

        if ($name !== '' && $city !== '') {
            $queries[] = "Barangay {$name}, {$city}, Philippines";
            $queries[] = "{$name}, {$city}, Philippines";
        }
        if ($name !== '' && $city !== '' && $province !== '') {
            $queries[] = "Barangay {$name}, {$city}, {$province}, Philippines";
        }
        if ($name !== '') {
            $queries[] = "Barangay {$name}, Philippines";
        }

        return array_unique($queries);
    }

    /**
     * Query Nominatim and return a GeoJSON FeatureCollection of the matching boundary.
     *
     * - When $requireAdminBoundary is true, only accepts features tagged as admin boundaries
     *   (class=boundary, type=administrative). Rejects POIs that happen to share the name.
     * - When false, accepts any polygon whose bbox area is above MIN_BBOX_AREA.
     *
     * @return array<string,mixed>|null GeoJSON FeatureCollection or null on miss
     */
    private function queryNominatim(string $query, bool $requireAdminBoundary): ?array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => self::USER_AGENT,
                'Accept' => 'application/json',
                'Accept-Language' => 'en',
            ])
                ->timeout(15)
                ->retry(2, 500)
                ->get(self::NOMINATIM_URL, [
                    'q' => $query,
                    'format' => 'geojson',
                    'polygon_geojson' => 1,
                    'countrycodes' => 'ph',
                    'limit' => 10,
                    'addressdetails' => 1,
                    'extratags' => 1,
                ]);

            if (! $response->successful()) {
                Log::warning('Nominatim request failed', [
                    'status' => $response->status(),
                    'query' => $query,
                ]);

                return null;
            }

            $data = $response->json();
            $features = $data['features'] ?? [];

            $candidates = [];
            foreach ($features as $feature) {
                $type = $feature['geometry']['type'] ?? null;
                if ($type !== 'Polygon' && $type !== 'MultiPolygon') {
                    continue;
                }

                $props = $feature['properties'] ?? [];
                $category = $props['category'] ?? null;
                $featType = $props['type'] ?? null;

                $isAdminBoundary = $category === 'boundary' && $featType === 'administrative';

                if ($requireAdminBoundary && ! $isAdminBoundary) {
                    continue;
                }

                $bboxArea = $this->bboxArea($feature['bbox'] ?? null);
                if ($bboxArea < self::MIN_BBOX_AREA) {
                    continue;
                }

                $candidates[] = ['feature' => $feature, 'area' => $bboxArea, 'isAdmin' => $isAdminBoundary];
            }

            if (empty($candidates)) {
                return null;
            }

            // Prefer admin boundaries, then by largest bbox (likely the real admin area).
            usort($candidates, function ($a, $b) {
                if ($a['isAdmin'] !== $b['isAdmin']) {
                    return $a['isAdmin'] ? -1 : 1;
                }

                return $b['area'] <=> $a['area'];
            });

            return [
                'type' => 'FeatureCollection',
                'features' => [$candidates[0]['feature']],
            ];
        } catch (\Throwable $e) {
            Log::warning('Nominatim fetch error', [
                'query' => $query,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Query Overpass API for admin_level=10 (barangay) boundary by name + city.
     * Most accurate source for Philippine barangays — uses raw OSM relations.
     *
     * @return array<string,mixed>|null GeoJSON FeatureCollection or null on miss
     */
    private function queryOverpass(Barangay $barangay): ?array
    {
        $name = trim((string) $barangay->name);
        $city = trim((string) $barangay->city_municipality);

        if ($name === '') {
            return null;
        }

        // Strip "City" suffix variants for OSM matching
        $cityNormalised = preg_replace('/\s+city$/i', '', $city) ?: '';

        // Overpass QL: find admin_level=10 relations with this name within the city
        $query = $cityNormalised !== ''
            ? <<<OVERPASS
            [out:json][timeout:25];
            area["name"~"^{$cityNormalised}( City)?\$", i]["admin_level"~"^[78]\$"]->.searchArea;
            relation["admin_level"="10"]["name"="{$name}"](area.searchArea);
            out geom;
            OVERPASS
            : <<<OVERPASS
            [out:json][timeout:25];
            relation["admin_level"="10"]["name"="{$name}"]["addr:country"="PH"];
            out geom;
            OVERPASS;

        try {
            $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                ->timeout(30)
                ->asForm()
                ->post(self::OVERPASS_URL, ['data' => $query]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();
            $elements = $data['elements'] ?? [];
            if (empty($elements)) {
                return null;
            }

            // Convert the first relation into a GeoJSON Polygon/MultiPolygon
            return $this->overpassRelationToGeoJSON($elements[0]);
        } catch (\Throwable $e) {
            Log::warning('Overpass fetch error', [
                'barangay_id' => $barangay->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Convert an Overpass `out geom` relation response into a GeoJSON FeatureCollection.
     * Handles relations with multiple `outer` ways (MultiPolygon).
     *
     * @param  array<string,mixed>  $relation
     */
    private function overpassRelationToGeoJSON(array $relation): ?array
    {
        $members = $relation['members'] ?? [];
        $outerRings = [];
        $innerRings = [];

        foreach ($members as $member) {
            if (($member['type'] ?? null) !== 'way') {
                continue;
            }
            $geometry = $member['geometry'] ?? [];
            $coords = [];
            foreach ($geometry as $pt) {
                $coords[] = [(float) $pt['lon'], (float) $pt['lat']];
            }
            if (count($coords) < 2) {
                continue;
            }
            $role = $member['role'] ?? 'outer';
            if ($role === 'inner') {
                $innerRings[] = $coords;
            } else {
                $outerRings[] = $coords;
            }
        }

        if (empty($outerRings)) {
            return null;
        }

        // Concatenate consecutive outer ways into a single closed ring per polygon.
        // For Tambo and most barangays this is a single ring.
        $polygon = $outerRings;
        if (count($outerRings) > 1) {
            // Try to merge — naively join ways that share endpoints.
            $polygon = [$this->joinRings($outerRings)];
        }

        $geometry = [
            'type' => 'Polygon',
            'coordinates' => array_merge($polygon, $innerRings),
        ];

        $name = $relation['tags']['name'] ?? null;

        return [
            'type' => 'FeatureCollection',
            'features' => [[
                'type' => 'Feature',
                'properties' => array_filter([
                    'name' => $name,
                    'admin_level' => $relation['tags']['admin_level'] ?? null,
                    'osm_id' => $relation['id'] ?? null,
                ]),
                'geometry' => $geometry,
            ]],
        ];
    }

    /**
     * Naive ring-joining: walk ways, concatenate by matching endpoints, ignore gaps.
     *
     * @param  array<int,array<int,array{0:float,1:float}>>  $ways
     * @return array<int,array{0:float,1:float}>
     */
    private function joinRings(array $ways): array
    {
        if (empty($ways)) {
            return [];
        }
        $result = $ways[0];
        $remaining = array_slice($ways, 1);

        while (! empty($remaining)) {
            $tail = end($result);
            $bestIdx = null;
            $bestReverse = false;
            foreach ($remaining as $idx => $way) {
                if ($way[0] === $tail) {
                    $bestIdx = $idx;
                    $bestReverse = false;
                    break;
                }
                if (end($way) === $tail) {
                    $bestIdx = $idx;
                    $bestReverse = true;
                    break;
                }
            }
            if ($bestIdx === null) {
                break;
            }
            $next = $bestReverse ? array_reverse($remaining[$bestIdx]) : $remaining[$bestIdx];
            $result = array_merge($result, array_slice($next, 1));
            unset($remaining[$bestIdx]);
            $remaining = array_values($remaining);
        }

        return $result;
    }

    /**
     * Compute the area of a [minLng, minLat, maxLng, maxLat] bbox in square degrees.
     */
    private function bboxArea(?array $bbox): float
    {
        if (! is_array($bbox) || count($bbox) !== 4) {
            return 0.0;
        }

        return abs(((float) $bbox[2] - (float) $bbox[0]) * ((float) $bbox[3] - (float) $bbox[1]));
    }
}
