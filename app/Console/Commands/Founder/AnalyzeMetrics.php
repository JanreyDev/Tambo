<?php

declare(strict_types=1);

namespace App\Console\Commands\Founder;

use App\Services\MabiniFounderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AnalyzeMetrics extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'founder:analyze-metrics';

    /**
     * The console command description.
     */
    protected $description = 'Use Mabini AI to analyze system metrics and generate insights';

    public function __construct(
        private readonly MabiniFounderService $mabini,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Analyzing system metrics with Mabini AI...');

        try {
            $insights = $this->mabini->generateInsights();

            if (empty($insights)) {
                $this->info('No new insights generated.');

                return self::SUCCESS;
            }

            $this->info('Generated '.count($insights).' insight(s):');

            foreach ($insights as $insight) {
                $severity = $insight['severity'] ?? 'info';
                $title = $insight['title'] ?? 'Untitled';
                $this->line("  [{$severity}] {$title}");
            }

            Log::info('founder:analyze-metrics completed', [
                'insight_count' => count($insights),
            ]);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Metric analysis failed: {$e->getMessage()}");
            Log::error('founder:analyze-metrics failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }
}
