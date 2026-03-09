<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\Founder\InfrastructureSnapshot;
use App\Services\CloudflareService;
use App\Services\DigitalOceanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class InfrastructureController extends Controller
{
    public function __construct(
        private readonly DigitalOceanService $digitalOcean,
        private readonly CloudflareService $cloudflare,
    ) {}

    /**
     * Get all DigitalOcean droplets with cached fallback.
     */
    public function droplets(): JsonResponse
    {
        $data = $this->getCachedOrFetch('droplets', 5, function (): array {
            return $this->digitalOcean->getDroplets();
        });

        return response()->json([
            'data' => $data['droplets'] ?? [],
            'cached' => $data['_cached'] ?? false,
            'fetched_at' => $data['_fetched_at'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Get all DigitalOcean managed databases with cached fallback.
     */
    public function databases(): JsonResponse
    {
        $data = $this->getCachedOrFetch('databases', 5, function (): array {
            return $this->digitalOcean->getDatabases();
        });

        return response()->json([
            'data' => $data['databases'] ?? [],
            'cached' => $data['_cached'] ?? false,
            'fetched_at' => $data['_fetched_at'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Get all Cloudflare domains with DNS records, cached for 15min.
     */
    public function domains(): JsonResponse
    {
        $data = $this->getCachedOrFetch('domains', 15, function (): array {
            return $this->cloudflare->getDomainsWithDns();
        });

        return response()->json([
            'data' => $data['domains'] ?? [],
            'cached' => $data['_cached'] ?? false,
            'fetched_at' => $data['_fetched_at'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Get DigitalOcean Spaces info, cached for 15min.
     */
    public function spaces(): JsonResponse
    {
        $data = $this->getCachedOrFetch('spaces', 15, function (): array {
            return $this->digitalOcean->getSpaces();
        });

        return response()->json([
            'data' => $data['spaces'] ?? [],
            'cached' => $data['_cached'] ?? false,
            'fetched_at' => $data['_fetched_at'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Return cached data if fresh, otherwise fetch and cache in the DB.
     *
     * @param  callable(): array<string, mixed>  $fetcher
     * @return array<string, mixed>
     */
    private function getCachedOrFetch(string $type, int $maxAgeMinutes, callable $fetcher): array
    {
        // Check for a fresh cached snapshot.
        if (InfrastructureSnapshot::isFresh($type, $maxAgeMinutes)) {
            $snapshot = InfrastructureSnapshot::latest($type);

            if ($snapshot !== null) {
                $data = $snapshot->data;
                $data['_cached'] = true;
                $data['_fetched_at'] = $snapshot->fetched_at->toIso8601String();

                return $data;
            }
        }

        // Fetch fresh data.
        try {
            $data = $fetcher();

            InfrastructureSnapshot::create([
                'snapshot_type' => $type,
                'data' => $data,
                'fetched_at' => now(),
                'created_at' => now(),
            ]);

            $data['_cached'] = false;
            $data['_fetched_at'] = now()->toIso8601String();

            return $data;
        } catch (\Exception $e) {
            Log::error("Infrastructure: failed to fetch {$type}", [
                'error' => $e->getMessage(),
            ]);

            // Fall back to stale cache if available.
            $staleSnapshot = InfrastructureSnapshot::latest($type);
            if ($staleSnapshot !== null) {
                $data = $staleSnapshot->data;
                $data['_cached'] = true;
                $data['_stale'] = true;
                $data['_fetched_at'] = $staleSnapshot->fetched_at->toIso8601String();

                return $data;
            }

            return ['error' => $e->getMessage(), '_cached' => false];
        }
    }
}
