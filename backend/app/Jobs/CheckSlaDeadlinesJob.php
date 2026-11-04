<?php

namespace App\Jobs;

use App\Services\SlaMonitoringService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckSlaDeadlinesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(SlaMonitoringService $slaService): void
    {
        Log::info("Executing background queue worker for FixMyCity SLA deadline audit...");
        $results = $slaService->checkDeadlines();
        Log::info("SLA queue job completed successfully. Active: {$results['active_total']}, Breached: {$results['breached']}, Nearing: {$results['nearing_breach']}");
    }
}
