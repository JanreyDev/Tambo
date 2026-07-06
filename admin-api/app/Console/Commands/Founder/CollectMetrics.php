<?php

declare(strict_types=1);

namespace App\Console\Commands\Founder;

use App\Models\Founder\MetricSnapshot;
use App\Services\DigitalOceanService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CollectMetrics extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'founder:collect-metrics';

    /**
     * The console command description.
     */
    protected $description = 'Collect infrastructure metrics from DigitalOcean and store in metric_snapshots';

    public function __construct(
        private readonly DigitalOceanService $digitalOcean,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Collecting infrastructure metrics...');

        try {
            $dropletsData = $this->digitalOcean->getDroplets();
            $droplets = $dropletsData['droplets'] ?? [];

            if (empty($droplets)) {
                $this->warn('No droplets found or API error.');
                Log::warning('founder:collect-metrics: no droplets returned', [
                    'response' => $dropletsData,
                ]);

                return self::SUCCESS;
            }

            $collected = 0;

            foreach ($droplets as $droplet) {
                $dropletId = $droplet['id'];
                $metrics = $this->digitalOcean->getDropletMetrics($dropletId, '1h');

                // Extract the latest metric values from the monitoring data.
                $cpuPercent = $this->extractLatestValue($metrics['cpu'] ?? []);
                $memoryFree = $this->extractLatestValue($metrics['memory_free'] ?? []);
                $memoryTotal = $this->extractLatestValue($metrics['memory_total'] ?? []);
                $bandwidthIn = $this->extractLatestValue($metrics['bandwidth_in'] ?? []);
                $bandwidthOut = $this->extractLatestValue($metrics['bandwidth_out'] ?? []);

                // Calculate memory percentage.
                $memoryPercent = 0.0;
                if ($memoryTotal > 0) {
                    $memoryPercent = round((1 - ($memoryFree / $memoryTotal)) * 100, 2);
                }

                // Disk percentage from droplet size info (approximate).
                $diskSize = $droplet['disk'] ?? 0;
                $diskPercent = 0.0; // DO monitoring API doesn't expose disk usage directly.

                MetricSnapshot::create([
                    'droplet_id' => $dropletId,
                    'cpu_percent' => min(100.0, max(0.0, $cpuPercent)),
                    'memory_percent' => min(100.0, max(0.0, $memoryPercent)),
                    'disk_percent' => $diskPercent,
                    'bandwidth_in' => max(0, (int) $bandwidthIn),
                    'bandwidth_out' => max(0, (int) $bandwidthOut),
                    'recorded_at' => now(),
                ]);

                $collected++;
            }

            $this->info("Collected metrics for {$collected} droplets.");
            Log::info('founder:collect-metrics completed', [
                'droplets_collected' => $collected,
            ]);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to collect metrics: {$e->getMessage()}");
            Log::error('founder:collect-metrics failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }

    /**
     * Extract the latest numeric value from DO monitoring API response data.
     *
     * @param  array<string, mixed>  $data
     */
    private function extractLatestValue(array $data): float
    {
        // DO monitoring returns data in Prometheus format:
        // { "result": [{ "values": [[timestamp, "value"], ...] }] }
        $results = $data['result'] ?? [];

        if (empty($results)) {
            return 0.0;
        }

        $values = $results[0]['values'] ?? [];

        if (empty($values)) {
            return 0.0;
        }

        // Get the last value in the time series.
        $lastValue = end($values);

        return (float) ($lastValue[1] ?? 0.0);
    }
}
