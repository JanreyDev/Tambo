<?php

declare(strict_types=1);

namespace App\Console\Commands\Founder;

use App\Models\Founder\SystemAlert;
use App\Models\ProductConnection;
use App\Services\TelegramService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckHealth extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'founder:check-health';

    /**
     * The console command description.
     */
    protected $description = 'Check health of all product APIs and create alerts on failures';

    public function __construct(
        private readonly TelegramService $telegram,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Checking product health...');

        $connections = ProductConnection::where('status', '!=', 'inactive')->get();

        if ($connections->isEmpty()) {
            $this->warn('No active product connections found.');

            return self::SUCCESS;
        }

        $failures = [];

        foreach ($connections as $connection) {
            $healthStatus = 'unknown';
            $errorMessage = null;
            $responseTime = null;

            try {
                $startTime = microtime(true);

                $response = Http::timeout(5)
                    ->withToken($connection->api_token)
                    ->get("{$connection->api_base_url}/up");

                $responseTime = (int) round((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    $healthStatus = 'healthy';
                    $this->info("  {$connection->product_name}: healthy ({$responseTime}ms)");
                } else {
                    $healthStatus = 'unhealthy';
                    $errorMessage = "HTTP {$response->status()}";
                    $this->error("  {$connection->product_name}: unhealthy ({$errorMessage})");
                }
            } catch (\Exception $e) {
                $healthStatus = 'error';
                $errorMessage = $e->getMessage();
                $this->error("  {$connection->product_name}: error ({$errorMessage})");
            }

            // Update the product connection status.
            $connection->update([
                'last_health_check_at' => now(),
                'last_health_status' => $healthStatus,
            ]);

            // Create alert on failure.
            if ($healthStatus !== 'healthy') {
                $severity = $healthStatus === 'error' ? 'critical' : 'warning';

                $alert = SystemAlert::create([
                    'severity' => $severity,
                    'source' => 'health_check',
                    'title' => "{$connection->product_name} is {$healthStatus}",
                    'description' => $errorMessage ?? "Product API returned {$healthStatus} status.",
                    'metadata' => [
                        'product_slug' => $connection->product_slug,
                        'api_base_url' => $connection->api_base_url,
                        'response_time_ms' => $responseTime,
                        'error' => $errorMessage,
                    ],
                    'created_at' => now(),
                ]);

                $failures[] = [
                    'product' => $connection->product_name,
                    'status' => $healthStatus,
                    'error' => $errorMessage,
                    'alert_id' => $alert->id,
                ];
            }
        }

        // Send Telegram alert for critical failures.
        if (! empty($failures)) {
            $criticalCount = collect($failures)->where('status', 'error')->count();

            if ($criticalCount > 0) {
                $failureList = collect($failures)
                    ->map(fn (array $f) => "- {$f['product']}: {$f['status']} ({$f['error']})")
                    ->implode("\n");

                $this->telegram->sendAlert(
                    severity: 'critical',
                    title: "{$criticalCount} product(s) unreachable",
                    message: $failureList,
                );
            }

            Log::warning('founder:check-health: failures detected', [
                'failures' => $failures,
            ]);
        }

        $this->info('Health check completed.');

        return self::SUCCESS;
    }
}
