<?php

namespace App\Providers;

use App\Models\Admin\Barangay;
use App\Models\PersonalAccessToken;
use App\Observers\BarangayObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use custom PersonalAccessToken model with device tracking columns
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Global API rate limiter: 60 requests per minute per IP.
        // Per-endpoint throttles (login 5/min, OTP 5/min) still stack on top.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // Auto-fetch OSM boundary polygon when a new barangay is onboarded.
        Barangay::observe(BarangayObserver::class);
    }
}
