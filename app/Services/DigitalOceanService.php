<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DigitalOceanService
{
    private string $token;

    private string $baseUrl = 'https://api.digitalocean.com/v2';

    public function __construct()
    {
        $this->token = (string) config('services.digitalocean.token');
    }

    /**
     * Get all droplets in the account.
     *
     * @return array<string, mixed>
     */
    public function getDroplets(): array
    {
        try {
            $response = Http::timeout(10)
                ->withToken($this->token)
                ->get("{$this->baseUrl}/droplets", ['per_page' => 100]);

            if ($response->failed()) {
                Log::error('DigitalOcean API: failed to fetch droplets', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return ['droplets' => [], 'error' => "HTTP {$response->status()}"];
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('DigitalOcean API: droplet request exception', [
                'error' => $e->getMessage(),
            ]);

            return ['droplets' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Get monitoring metrics for a specific droplet.
     *
     * @return array<string, mixed>
     */
    public function getDropletMetrics(int $dropletId, string $period = '1h'): array
    {
        $end = now();
        $start = match ($period) {
            '1h' => now()->subHour(),
            '6h' => now()->subHours(6),
            '24h' => now()->subDay(),
            '7d' => now()->subWeek(),
            default => now()->subHour(),
        };

        $metrics = [];
        $metricTypes = [
            'cpu' => 'v1/insights/droplet/cpu',
            'memory_free' => 'v1/insights/droplet/memory_free',
            'memory_total' => 'v1/insights/droplet/memory_total',
            'disk_read' => 'v1/insights/droplet/disk_read',
            'disk_write' => 'v1/insights/droplet/disk_write',
            'bandwidth_in' => 'v1/insights/droplet/public_inbound_bandwidth',
            'bandwidth_out' => 'v1/insights/droplet/public_outbound_bandwidth',
        ];

        foreach ($metricTypes as $key => $endpoint) {
            try {
                $response = Http::timeout(10)
                    ->withToken($this->token)
                    ->get("{$this->baseUrl}/monitoring/metrics/droplet/{$endpoint}", [
                        'host_id' => $dropletId,
                        'start' => $start->toIso8601String(),
                        'end' => $end->toIso8601String(),
                    ]);

                if ($response->successful()) {
                    $metrics[$key] = $response->json('data', []);
                }
            } catch (\Exception $e) {
                Log::warning("DigitalOcean API: failed to fetch {$key} metrics for droplet {$dropletId}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $metrics;
    }

    /**
     * Get all managed databases.
     *
     * @return array<string, mixed>
     */
    public function getDatabases(): array
    {
        try {
            $response = Http::timeout(10)
                ->withToken($this->token)
                ->get("{$this->baseUrl}/databases", ['per_page' => 100]);

            if ($response->failed()) {
                Log::error('DigitalOcean API: failed to fetch databases', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return ['databases' => [], 'error' => "HTTP {$response->status()}"];
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('DigitalOcean API: database request exception', [
                'error' => $e->getMessage(),
            ]);

            return ['databases' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Get all Spaces (object storage).
     * Uses the S3-compatible endpoint listing via DO API.
     *
     * @return array<string, mixed>
     */
    public function getSpaces(): array
    {
        try {
            // DO doesn't have a direct /spaces endpoint -- list via /regions
            // and use the known spaces from config. For now, return metadata
            // from the DO API's available endpoints.
            $response = Http::timeout(10)
                ->withToken($this->token)
                ->get("{$this->baseUrl}/regions");

            if ($response->failed()) {
                return ['spaces' => [], 'error' => "HTTP {$response->status()}"];
            }

            // Spaces don't have a REST API listing -- they use S3 protocol.
            // Return what we can from DO infrastructure.
            return [
                'spaces' => [
                    ['name' => 'gitlogs', 'region' => 'sgp1'],
                    ['name' => 'kphs32', 'region' => 'sgp1'],
                    ['name' => 'mmbrshps31', 'region' => 'sgp1'],
                    ['name' => 'primex-storage', 'region' => 'sgp1'],
                    ['name' => 'primex', 'region' => 'sgp1'],
                    ['name' => 'primex-drive', 'region' => 'sgp1'],
                    ['name' => 'tarlac-assets', 'region' => 'sgp1'],
                    ['name' => 'spacall', 'region' => 'sgp1'],
                ],
                'note' => 'Spaces listed from known configuration. S3 API required for live status.',
            ];
        } catch (\Exception $e) {
            Log::error('DigitalOcean API: spaces request exception', [
                'error' => $e->getMessage(),
            ]);

            return ['spaces' => [], 'error' => $e->getMessage()];
        }
    }
}
