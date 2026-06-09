<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

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
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'reply' => "⚠️ **Too Many Questions!**\n\nYou have reached the rate limit (10 questions per minute). Please take a short break to care for your baby and try again in a minute.",
                        'is_mock' => true,
                        'error' => 'Too many requests'
                    ], 429, $headers);
                });
        });
    }
}

