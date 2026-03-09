<?php

declare(strict_types=1);

namespace App\Console\Commands\Founder;

use App\Models\Founder\MetricSnapshot;
use App\Models\Founder\SystemAlert;
use App\Models\ProductConnection;
use App\Services\TelegramService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MorningBriefing extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'founder:morning-briefing';

    /**
     * The console command description.
     */
    protected $description = 'Send daily morning briefing summary via Telegram';

    public function __construct(
        private readonly TelegramService $telegram,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Generating morning briefing...');

        try {
            $summary = $this->buildBriefingSummary();
            $sent = $this->telegram->sendBriefing($summary);

            if ($sent) {
                $this->info('Morning briefing sent to Telegram.');
                Log::info('founder:morning-briefing sent successfully');
            } else {
                $this->warn('Failed to send morning briefing (Telegram not configured or API error).');
                Log::warning('founder:morning-briefing: Telegram send failed');
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Morning briefing failed: {$e->getMessage()}");
            Log::error('founder:morning-briefing failed', [
                'error' => $e->getMessage(),
            ]);

            return self::FAILURE;
        }
    }

    /**
     * Build the daily briefing summary text.
     */
    private function buildBriefingSummary(): string
    {
        $lines = [];
        $lines[] = '<b>Date:</b> '.now()->format('F j, Y (l)');
        $lines[] = '';

        // Product health status.
        $lines[] = '<b>Product Health:</b>';
        $connections = ProductConnection::where('status', '!=', 'inactive')->get();

        foreach ($connections as $connection) {
            $status = $connection->last_health_status ?? 'unknown';
            $statusIcon = match ($status) {
                'healthy' => 'OK',
                'unhealthy' => 'WARN',
                'error' => 'DOWN',
                default => '???',
            };
            $lines[] = "  [{$statusIcon}] {$connection->product_name}";
        }
        $lines[] = '';

        // Unresolved alerts.
        $unresolvedCount = SystemAlert::unresolved()->count();
        $criticalCount = SystemAlert::unresolved()->critical()->count();
        $lines[] = "<b>Alerts:</b> {$unresolvedCount} unresolved ({$criticalCount} critical)";

        if ($criticalCount > 0) {
            $criticalAlerts = SystemAlert::unresolved()
                ->critical()
                ->orderByDesc('created_at')
                ->limit(5)
                ->get();

            foreach ($criticalAlerts as $alert) {
                $lines[] = "  - {$alert->title}";
            }
        }
        $lines[] = '';

        // Server resource summary (latest snapshots).
        $lines[] = '<b>Server Resources (latest):</b>';
        $latestMetrics = MetricSnapshot::query()
            ->selectRaw('DISTINCT ON (droplet_id) droplet_id, cpu_percent, memory_percent, disk_percent, recorded_at')
            ->orderByRaw('droplet_id, recorded_at DESC')
            ->limit(10)
            ->get();

        if ($latestMetrics->isEmpty()) {
            $lines[] = '  No metric data available.';
        } else {
            foreach ($latestMetrics as $metric) {
                $lines[] = "  Droplet {$metric->droplet_id}: CPU {$metric->cpu_percent}% | RAM {$metric->memory_percent}%";
            }
        }

        $lines[] = '';

        // Recent deployments count (last 24h).
        $gitlabToken = config('services.gitlab.token');
        $groupId = config('services.gitlab.group_id');
        $deploymentCount = 0;

        if ($gitlabToken && $groupId) {
            try {
                $response = Http::timeout(5)
                    ->withToken($gitlabToken)
                    ->get("https://gitlab.com/api/v4/groups/{$groupId}/projects", [
                        'per_page' => 50,
                        'include_subgroups' => true,
                    ]);

                if ($response->successful()) {
                    foreach ($response->json() as $project) {
                        try {
                            $pipelines = Http::timeout(5)
                                ->withToken($gitlabToken)
                                ->get("https://gitlab.com/api/v4/projects/{$project['id']}/pipelines", [
                                    'updated_after' => now()->subDay()->toIso8601String(),
                                    'per_page' => 100,
                                ]);

                            if ($pipelines->successful()) {
                                $deploymentCount += count($pipelines->json());
                            }
                        } catch (\Exception) {
                            // Skip individual project failures.
                        }
                    }
                }
            } catch (\Exception) {
                // Skip GitLab failures in briefing.
            }
        }

        $lines[] = "<b>Deployments (24h):</b> {$deploymentCount} pipeline runs";

        return implode("\n", $lines);
    }
}
