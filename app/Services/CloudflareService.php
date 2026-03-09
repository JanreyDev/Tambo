<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudflareService
{
    private string $token;

    private string $baseUrl = 'https://api.cloudflare.com/client/v4';

    public function __construct()
    {
        $this->token = (string) config('services.cloudflare.token');
    }

    /**
     * Get all zones (domains) in the account.
     *
     * @return array<string, mixed>
     */
    public function getZones(): array
    {
        try {
            $response = Http::timeout(10)
                ->withToken($this->token)
                ->get("{$this->baseUrl}/zones", [
                    'per_page' => 50,
                    'status' => 'active',
                ]);

            if ($response->failed()) {
                Log::error('Cloudflare API: failed to fetch zones', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return ['result' => [], 'error' => "HTTP {$response->status()}"];
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('Cloudflare API: zone request exception', [
                'error' => $e->getMessage(),
            ]);

            return ['result' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Get DNS records for a specific zone.
     *
     * @return array<string, mixed>
     */
    public function getDnsRecords(string $zoneId): array
    {
        try {
            $response = Http::timeout(10)
                ->withToken($this->token)
                ->get("{$this->baseUrl}/zones/{$zoneId}/dns_records", [
                    'per_page' => 100,
                ]);

            if ($response->failed()) {
                Log::error('Cloudflare API: failed to fetch DNS records', [
                    'zone_id' => $zoneId,
                    'status' => $response->status(),
                ]);

                return ['result' => [], 'error' => "HTTP {$response->status()}"];
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('Cloudflare API: DNS record request exception', [
                'zone_id' => $zoneId,
                'error' => $e->getMessage(),
            ]);

            return ['result' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Get all zones with their DNS records aggregated.
     *
     * @return array<string, mixed>
     */
    public function getDomainsWithDns(): array
    {
        $zones = $this->getZones();

        if (isset($zones['error'])) {
            return $zones;
        }

        $domains = [];

        foreach ($zones['result'] ?? [] as $zone) {
            $dnsRecords = $this->getDnsRecords($zone['id']);

            $domains[] = [
                'id' => $zone['id'],
                'name' => $zone['name'],
                'status' => $zone['status'],
                'plan' => $zone['plan']['name'] ?? 'unknown',
                'name_servers' => $zone['name_servers'] ?? [],
                'dns_record_count' => count($dnsRecords['result'] ?? []),
                'dns_records' => collect($dnsRecords['result'] ?? [])
                    ->map(fn (array $record) => [
                        'type' => $record['type'],
                        'name' => $record['name'],
                        'content' => $record['content'],
                        'proxied' => $record['proxied'] ?? false,
                        'ttl' => $record['ttl'],
                    ])
                    ->all(),
            ];
        }

        return ['domains' => $domains];
    }
}
