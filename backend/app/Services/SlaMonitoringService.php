<?php

namespace App\Services;

use App\Models\Complaint;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;

class SlaMonitoringService
{
    /**
     * Checks all pending/in-progress complaints against SLA deadlines.
     *
     * @return array
     */
    public function checkDeadlines(): array
    {
        $now = Carbon::now();
        $warningWindow = Carbon::now()->addHours(12);

        $activeComplaints = Complaint::whereIn('status', ['Pending', 'In Progress'])
            ->whereNotNull('sla_deadline')
            ->with(['department', 'category', 'user'])
            ->get();

        $breachedCount = 0;
        $warningCount = 0;
        $onTrackCount = 0;

        foreach ($activeComplaints as $complaint) {
            $deadline = Carbon::parse($complaint->sla_deadline);

            if ($deadline->isPast()) {
                $breachedCount++;
                $this->alertSlaBreach($complaint);
            } elseif ($deadline->lessThanOrEqualTo($warningWindow)) {
                $warningCount++;
                $this->alertSlaWarning($complaint, $deadline->diffInHours($now));
            } else {
                $onTrackCount++;
            }
        }

        return [
            'active_total' => $activeComplaints->count(),
            'breached' => $breachedCount,
            'nearing_breach' => $warningCount,
            'on_track' => $onTrackCount,
            'checked_at' => $now->toIso8601String(),
        ];
    }

    protected function alertSlaBreach(Complaint $complaint): void
    {
        // Check if breach notification was already sent today for this complaint
        $alreadyNotified = Notification::where('complaint_id', $complaint->id)
            ->where('type', 'sla_breached')
            ->where('created_at', '>=', Carbon::now()->subHours(12))
            ->exists();

        if ($alreadyNotified) {
            return;
        }

        // Notify department authority staff
        $staffMembers = User::where('role', 'authority')
            ->where('department_id', $complaint->department_id)
            ->get();

        foreach ($staffMembers as $staff) {
            Notification::create([
                'user_id' => $staff->id,
                'complaint_id' => $complaint->id,
                'title' => "⚠️ SLA Breached: Complaint #{$complaint->tracking_number}",
                'message' => "Complaint '{$complaint->title}' in {$complaint->department->department_name} has exceeded its SLA resolution deadline.",
                'type' => 'sla_breached',
            ]);
        }

        // Notify admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'complaint_id' => $complaint->id,
                'title' => "⚠️ SLA Escalation: Complaint #{$complaint->tracking_number}",
                'message' => "Overdue complaint #{$complaint->tracking_number} ({$complaint->department->department_name}).",
                'type' => 'sla_breached',
            ]);
        }
    }

    protected function alertSlaWarning(Complaint $complaint, int $hoursLeft): void
    {
        $alreadyWarned = Notification::where('complaint_id', $complaint->id)
            ->where('type', 'sla_warning')
            ->where('created_at', '>=', Carbon::now()->subHours(12))
            ->exists();

        if ($alreadyWarned) {
            return;
        }

        $staffMembers = User::where('role', 'authority')
            ->where('department_id', $complaint->department_id)
            ->get();

        foreach ($staffMembers as $staff) {
            Notification::create([
                'user_id' => $staff->id,
                'complaint_id' => $complaint->id,
                'title' => "⏳ SLA Approaching: Complaint #{$complaint->tracking_number}",
                'message' => "Complaint '{$complaint->title}' has ~{$hoursLeft} hours remaining before SLA deadline.",
                'type' => 'sla_warning',
            ]);
        }
    }
}
