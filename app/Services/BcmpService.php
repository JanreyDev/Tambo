<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ProductConnection;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Server-side HTTP client for communicating with bcmp-api.
 *
 * Uses the ProductConnection model to resolve the API base URL
 * and encrypted authentication token for the BCMP product.
 */
class BcmpService
{
    private ?ProductConnection $connection = null;

    /**
     * Get the BCMP product connection (lazy-loaded).
     */
    private function connection(): ProductConnection
    {
        if ($this->connection === null) {
            $this->connection = ProductConnection::where('product_slug', 'bcmp')->firstOrFail();
        }

        return $this->connection;
    }

    /**
     * Check whether config-based (env var) connection is available.
     */
    private function hasEnvConfig(): bool
    {
        return ! empty(config('services.bcmp.api_url'));
    }

    /**
     * Get the base URL for bcmp-api.
     */
    private function baseUrl(): string
    {
        if ($this->hasEnvConfig()) {
            return rtrim((string) config('services.bcmp.api_url'), '/');
        }

        return rtrim($this->connection()->api_base_url, '/');
    }

    /**
     * Get the auth token for bcmp-api (empty string if none configured).
     */
    private function token(): string
    {
        if ($this->hasEnvConfig()) {
            return (string) config('services.bcmp.api_token', '');
        }

        return $this->connection()->api_token;
    }

    /**
     * Make a GET request to bcmp-api.
     *
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    public function get(string $path, array $query = []): array
    {
        return $this->request('GET', $path, query: $query);
    }

    /**
     * Make a POST request to bcmp-api.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function post(string $path, array $data = []): array
    {
        return $this->request('POST', $path, data: $data);
    }

    /**
     * Make a PATCH request to bcmp-api.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function patch(string $path, array $data = []): array
    {
        return $this->request('PATCH', $path, data: $data);
    }

    /**
     * Make a DELETE request to bcmp-api.
     *
     * @return array<string, mixed>
     */
    public function delete(string $path): array
    {
        return $this->request('DELETE', $path);
    }

    /**
     * Execute an HTTP request to bcmp-api.
     *
     * @param  array<string, mixed>  $query
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, array $query = [], array $data = []): array
    {
        $url = $this->baseUrl().'/'.ltrim($path, '/');

        try {
            $pending = Http::timeout(15)
                ->withUserAgent('PrimeX-API/1.0 (internal)')
                ->withoutVerifying()
                ->acceptJson();

            $token = $this->token();
            if ($token !== '') {
                $pending = $pending->withToken($token);
            }

            /** @var Response $response */
            $response = match ($method) {
                'GET' => $pending->get($url, $query),
                'POST' => $pending->post($url, $data),
                'PATCH' => $pending->patch($url, $data),
                'DELETE' => $pending->delete($url),
                default => throw new \InvalidArgumentException("Unsupported method: {$method}"),
            };

            return [
                'status' => $response->status(),
                'data' => $response->json(),
                'ok' => $response->successful(),
            ];
        } catch (\Throwable $e) {
            Log::error('BcmpService request failed', [
                'method' => $method,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 500,
                'data' => ['message' => 'Failed to connect to BCMP API.'],
                'ok' => false,
            ];
        }
    }
}
