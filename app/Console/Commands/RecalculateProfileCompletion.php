<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant\Resident;
use Illuminate\Console\Command;

class RecalculateProfileCompletion extends Command
{
    protected $signature = 'residents:recalculate-completion
                            {--barangay= : Recalculate for a specific barangay UUID}
                            {--dry-run  : Show what would change without saving}';

    protected $description = 'Recalculate profile_completion_pct for all residents using the current formula.';

    public function handle(): int
    {
        $barangayId = $this->option('barangay');
        $dryRun = $this->option('dry-run');

        $query = Resident::query()->withoutGlobalScopes();

        if ($barangayId) {
            $query->where('barangay_id', $barangayId);
        }

        $total = $query->count();
        $updated = 0;
        $skipped = 0;

        if ($total === 0) {
            $this->warn('No residents found.');

            return self::SUCCESS;
        }

        $this->info("Processing {$total} resident(s)...".($dryRun ? ' [DRY RUN]' : ''));

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunkById(200, function ($residents) use ($dryRun, &$updated, &$skipped, $bar) {
            foreach ($residents as $resident) {
                $newPct = $resident->calculateProfileCompletion();

                if ($resident->profile_completion_pct !== $newPct) {
                    if (! $dryRun) {
                        $resident->timestamps = false;
                        $resident->updateQuietly(['profile_completion_pct' => $newPct]);
                    }
                    $updated++;
                } else {
                    $skipped++;
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();

        $this->info("Done. Updated: {$updated} | Already correct: {$skipped}".($dryRun ? ' [no changes saved]' : ''));

        return self::SUCCESS;
    }
}
