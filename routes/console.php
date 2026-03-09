<?php

declare(strict_types=1);

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Founder Command Center Scheduled Tasks
|--------------------------------------------------------------------------
|
| These tasks power the automated monitoring, alerting, and cleanup
| for the PrimeX Command Center at founder.pulitika.ph.
|
*/

// Collect infrastructure metrics every 5 minutes.
Schedule::command('founder:collect-metrics')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Check product health every 5 minutes.
Schedule::command('founder:check-health')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// AI metric analysis every 6 hours.
Schedule::command('founder:analyze-metrics')
    ->everySixHours()
    ->withoutOverlapping()
    ->runInBackground();

// Morning briefing at 7:00 AM PHT (23:00 UTC previous day).
Schedule::command('founder:morning-briefing')
    ->dailyAt('23:00') // 7:00 AM PHT = 23:00 UTC (previous day)
    ->withoutOverlapping();

// Cleanup old metric snapshots weekly (Sunday at midnight UTC).
Schedule::command('founder:cleanup-metrics')
    ->weekly()
    ->sundays()
    ->at('00:00')
    ->withoutOverlapping();

// Cleanup expired sessions every hour.
Schedule::command('founder:cleanup-sessions')
    ->hourly()
    ->withoutOverlapping();
