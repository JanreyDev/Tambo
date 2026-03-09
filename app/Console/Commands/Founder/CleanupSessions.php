<?php

declare(strict_types=1);

namespace App\Console\Commands\Founder;

use App\Models\Founder\FounderSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupSessions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'founder:cleanup-sessions';

    /**
     * The console command description.
     */
    protected $description = 'Delete expired founder sessions from the database';

    public function handle(): int
    {
        $this->info('Cleaning up expired founder sessions...');

        try {
            $deleted = FounderSession::where('expires_at', '<', now())->delete();

            $this->info("Deleted {$deleted} expired session(s).");
            Log::info('founder:cleanup-sessions completed', [
                'deleted' => $deleted,
            ]);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Session cleanup failed: {$e->getMessage()}");
            Log::error('founder:cleanup-sessions failed', [
                'error' => $e->getMessage(),
            ]);

            return self::FAILURE;
        }
    }
}
