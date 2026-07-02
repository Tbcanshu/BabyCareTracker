<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\PasswordResetController;

Route::prefix('v1')->group(function () {

    // Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

        Route::get('/reset-password/{token}', function ($token) {
            return response()->json([
                'message' => 'Pass this token and email to /api/v1/auth/reset-password via POST',
                'token' => $token
            ]);
        })->name('password.reset');
    });

    // Public Chat
    Route::middleware('throttle:chat')->post('/chat', [ChatController::class, 'chat']);

    // Protected Routes
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::apiResource('babies', ActivityController::class)
            ->only(['index', 'store']);

        Route::get('/activities', [ActivityController::class, 'index']);
        Route::post('/activities', [ActivityController::class, 'store']);
    });
});