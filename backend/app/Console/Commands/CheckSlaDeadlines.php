<?php

namespace App\Console\Commands;

use App\Jobs\CheckSlaDeadlinesJob;
use App\Services\SlaMonitoringService;
use Illuminate\Console\Command;

class CheckSlaDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sla:check {--queue : Dispatch audit job to background queue}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit active complaints against SLA deadlines and dispatch escalation notifications';

    /**
     * Execute the console command.
     */
    public function handle(SlaMonitoringService $slaService): int
    {
        if ($this->option('queue')) {
            CheckSlaDeadlinesJob::dispatch();
            $this->info('FixMyCity SLA deadline audit job dispatched to queue.');
            $this->line('Run "php artisan queue:work" to process queued background jobs.');
            return Command::SUCCESS;
        }

        $this->info('Running FixMyCity SLA deadline audit...');
        $results = $slaService->checkDeadlines();

        $this->info("Audit Complete:");
        $this->line("- Active Complaints: {$results['active_total']}");
        $this->line("- Breached SLA: {$results['breached']}");
        $this->line("- Approaching Deadline (<12h): {$results['nearing_breach']}");
        $this->line("- On Track: {$results['on_track']}");

        return Command::SUCCESS;
    }
}
