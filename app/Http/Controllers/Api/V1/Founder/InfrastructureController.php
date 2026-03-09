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
     * Transforms raw DO API response into frontend DropletMetrics format.
     */
    public function droplets(): JsonResponse
    {
        $data = $this->getCachedOrFetch('droplets', 5, function (): array {
            return $this->digitalOcean->getDroplets();
        });

        $transformed = collect($data['droplets'] ?? [])
            ->map(fn (array $droplet) => [
                'id' => (string) $droplet['id'],
                'name' => $droplet['name'],
                'ip' => $this->extractPublicIp($droplet),
                'status' => $droplet['status'] === 'active' ? 'active' : 'off',
                'region' => $droplet['region']['slug'] ?? $droplet['region'] ?? 'unknown',
                'spec' => $this->formatDropletSpec($droplet),
                'cpu_percent' => 0,
                'ram_percent' => 0,
                'disk_percent' => 0,
                'uptime_seconds' => $this->calculateUptime($droplet),
            ])
            ->all();

        return response()->json([
            'data' => $transformed,
            'cached' => $data['_cached'] ?? false,
            'fetched_at' => $data['_fetched_at'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Get all DigitalOcean managed databases with cached fallback.
     * Transforms raw DO API response into frontend DatabaseStatus format.
     */
    public function databases(): JsonResponse
    {
        $data = $this->getCachedOrFetch('databases', 5, function (): array {
            return $this->digitalOcean->getDatabases();
        });

        $transformed = collect($data['databases'] ?? [])
            ->map(fn (array $db) => [
                'id' => $db['id'],
                'name' => $db['name'],
                'engine' => $db['engine'] ?? 'unknown',
                'version' => (string) ($db['version'] ?? ''),
                'status' => $db['status'] ?? 'offline',
                'connection_count' => $db['connection']['pool_size'] ?? $db['num_nodes'] ?? 0,
                'size_bytes' => ($db['storage_size_mib'] ?? 0) * 1024 * 1024,
                'host' => $db['connection']['host'] ?? $db['private_connection']['host'] ?? '',
            ])
            ->all();

        return response()->json([
            'data' => $transformed,
            'cached' => $data['_cached'] ?? false,
            'fetched_at' => $data['_fetched_at'] ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Get all Cloudflare domains, cached for 15min.
     * Transforms raw CF API response into frontend DomainStatus format.
     */
    public function domains(): JsonResponse
    {
        $data = $this->getCachedOrFetch('domains', 15, function (): array {
            return $this->cloudflare->getDomainsWithDns();
        });

        $transformed = collect($data['domains'] ?? [])
            ->map(fn (array $domain) => [
                'domain' => $domain['name'],
                'ssl_status' => 'active',
                'proxy_status' => $this->detectProxyStatus($domain),
                'plan' => $domain['plan'] ?? 'Free',
                'product_group' => $this->getDomainProductGroup($domain['name']),
            ])
            ->all();

        return response()->json([
            'data' => $transformed,
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
     * Extract the public IPv4 address from a droplet's networks.
     */
    private function extractPublicIp(array $droplet): string
    {
        foreach ($droplet['networks']['v4'] ?? [] as $network) {
            if (($network['type'] ?? '') === 'public') {
                return $network['ip_address'];
            }
        }

        return 'N/A';
    }

    /**
     * Format droplet spec string (e.g., "2vCPU/4GB").
     */
    private function formatDropletSpec(array $droplet): string
    {
        $vcpus = $droplet['vcpus'] ?? $droplet['size']['vcpus'] ?? 0;
        $memoryMb = $droplet['memory'] ?? $droplet['size']['memory'] ?? 0;
        $memoryGb = $memoryMb >= 1024 ? round($memoryMb / 1024).'GB' : $memoryMb.'MB';

        return "{$vcpus}vCPU/{$memoryGb}";
    }

    /**
     * Calculate uptime in seconds from droplet created_at if active.
     */
    private function calculateUptime(array $droplet): int
    {
        if (($droplet['status'] ?? '') !== 'active' || empty($droplet['created_at'])) {
            return 0;
        }

        try {
            $created = \Carbon\Carbon::parse($droplet['created_at']);

            return (int) $created->diffInSeconds(now());
        } catch (\Exception) {
            return 0;
        }
    }

    /**
     * Detect if the majority of DNS records for a domain are proxied.
     */
    private function detectProxyStatus(array $domain): string
    {
        $records = $domain['dns_records'] ?? [];
        if (empty($records)) {
            return 'dns_only';
        }

        $proxiedCount = collect($records)
            ->filter(fn (array $r) => ($r['proxied'] ?? false) === true)
            ->count();

        return $proxiedCount > 0 ? 'proxied' : 'dns_only';
    }

    /**
     * Map a domain name to its PrimeX product group.
     */
    private function getDomainProductGroup(string $domain): string
    {
        return match ($domain) {
            'kapitan.ph', 'kabataan.ph', 'barangay.org.ph' => 'BCMP',
            'tarlac.ph' => 'LGMP',
            'pulitika.ph' => 'Pulitika',
            'spacall.ph' => 'SPACALL',
            'barangaymo.com' => 'Barangaymo',
            'robes.ph' => 'PDMP',
            'vantagehunt.com' => 'VantageHunt',
            'primex.ventures' => 'Corporate',
            'kongreso.ph', 'senador.ph', 'gobernor.ph' => 'Future',
            default => 'Other',
        };
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
