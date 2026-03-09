<?php

declare(strict_types=1);

namespace App\Console\Commands\Founder;

use App\Models\Founder\MetricSnapshot;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupMetrics extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'founder:cleanup-metrics
                            {--days=90 : Delete metric snapshots older than this many days}';

    /**
     * The console command description.
     */
    protected $description = 'Delete metric snapshots older than 90 days to manage database size';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $this->info("Deleting metric snapshots older than {$days} days (before {$cutoff->toDateString()})...");

        try {
            $deleted = MetricSnapshot::where('recorded_at', '<', $cutoff)->delete();

            $this->info("Deleted {$deleted} metric snapshot(s).");
            Log::info('founder:cleanup-metrics completed', [
                'deleted' => $deleted,
                'cutoff_days' => $days,
            ]);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Cleanup failed: {$e->getMessage()}");
            Log::error('founder:cleanup-metrics failed', [
                'error' => $e->getMessage(),
            ]);

            return self::FAILURE;
        }
    }
}
