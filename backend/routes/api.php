<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\HeatmapController;
use App\Http\Controllers\Api\NotificationController;
use App\Services\SlaMonitoringService;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/departments/{id}', [DepartmentController::class, 'show']);

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/complaints', [ComplaintController::class, 'index']);
Route::get('/complaints/{idOrTracking}', [ComplaintController::class, 'show']);
Route::post('/complaints', [ComplaintController::class, 'store']); // allows optional token

Route::get('/heatmap', [HeatmapController::class, 'index']);
Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::post('/complaints/{id}/upvote', [ComplaintController::class, 'toggleUpvote']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Authority & Admin Workflow
    Route::middleware('role:authority,admin')->group(function () {
        Route::match(['patch', 'post'], '/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);
    });

    // Admin Management
    Route::middleware('role:admin')->group(function () {
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);

        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);

        Route::post('/sla/trigger-check', function (SlaMonitoringService $slaService) {
            $results = $slaService->checkDeadlines();
            return response()->json([
                'message' => 'SLA check completed',
                'results' => $results,
            ]);
        });
    });
});
