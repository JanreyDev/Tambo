<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Admin\Barangay;
use Illuminate\Console\Command;

class RecalculateBarangayStorage extends Command
{
    protected $signature = 'barangay:recalculate-storage
                            {--id= : Recalculate for a specific barangay UUID}';

    protected $description = 'Recalculate storage_used_bytes from the files table for all (or one) barangay.';

    public function handle(): int
    {
        $barangayId = $this->option('id');

        if ($barangayId) {
            $barangay = Barangay::find($barangayId);
            if (! $barangay) {
                $this->error("Barangay {$barangayId} not found.");

                return self::FAILURE;
            }

            $this->recalculate($barangay);

            return self::SUCCESS;
        }

        $barangays = Barangay::all();
        $this->info("Recalculating storage for {$barangays->count()} barangays...");

        $bar = $this->output->createProgressBar($barangays->count());
        $bar->start();

        foreach ($barangays as $barangay) {
            $this->recalculate($barangay, silent: true);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Done.');

        return self::SUCCESS;
    }

    private function recalculate(Barangay $barangay, bool $silent = false): void
    {
        $oldBytes = $barangay->storage_used_bytes;
        $newBytes = $barangay->recalculateStorage();

        if (! $silent) {
            $this->info(sprintf(
                '%s: %s -> %s',
                $barangay->name,
                $this->formatBytes($oldBytes),
                $this->formatBytes($newBytes),
            ));
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 1).' '.$units[$i];
    }
}
