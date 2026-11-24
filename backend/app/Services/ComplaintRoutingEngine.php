<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Complaint;
use App\Models\StatusHistory;
use App\Models\User;
use Carbon\Carbon;
use Exception;

class ComplaintRoutingEngine
{
    protected ComplaintNotificationService $notificationService;

    public function __construct(?ComplaintNotificationService $notificationService = null)
    {
        $this->notificationService = $notificationService ?? app(ComplaintNotificationService::class);
    }
    /**
     * Permitted state transitions in the FixMyCity State Machine.
     */
    protected const ALLOWED_TRANSITIONS = [
        'Pending' => ['In Progress', 'Rejected'],
        'In Progress' => ['Resolved', 'Pending', 'Rejected'],
        'Resolved' => ['In Progress'], // Re-opening
        'Rejected' => ['Pending'],     // Re-evaluating
    ];

    /**
     * Resolves the department routing and SLA deadline for a complaint.
     *
     * @param int $categoryId
     * @param string|null $priority
     * @return array
     * @throws Exception
     */
    public function resolveRouting(int $categoryId, ?string $priority = null): array
    {
        $category = Category::with('department')->find($categoryId);

        if (!$category) {
            throw new Exception("Invalid category provided: ID {$categoryId}");
        }

        $resolvedPriority = $priority ?: $category->default_priority ?: 'Medium';

        // SLA deadline calculation: category SLA hours adjusted by priority
        $baseSlaHours = $category->sla_hours ?: ($category->department ? $category->department->sla_hours : 48);

        $slaMultiplier = match (strtolower($resolvedPriority)) {
            'urgent' => 0.5,
            'high' => 0.75,
            'medium' => 1.0,
            'low' => 1.5,
            default => 1.0,
        };

        $effectiveSlaHours = (int) ceil($baseSlaHours * $slaMultiplier);
        $slaDeadline = Carbon::now()->addHours($effectiveSlaHours);

        return [
            'department_id' => $category->department_id,
            'category_name' => $category->category_name,
            'department_name' => $category->department ? $category->department->department_name : 'Unknown Department',
            'priority' => $resolvedPriority,
            'sla_hours' => $effectiveSlaHours,
            'sla_deadline' => $slaDeadline,
        ];
    }

    /**
     * Transitions a complaint to a new status according to the state machine rules.
     *
     * @param Complaint $complaint
     * @param string $newStatus
     * @param User|null $user
     * @param string|null $notes
     * @param string|null $resolutionImage
     * @return Complaint
     * @throws Exception
     */
    public function transitionStatus(
        Complaint $complaint,
        string $newStatus,
        ?User $user = null,
        ?string $notes = null,
        ?string $resolutionImage = null
    ): Complaint {
        $currentStatus = $complaint->status;

        if ($currentStatus === $newStatus) {
            return $complaint;
        }

        // Validate state machine rule
        $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
        if (!in_array($newStatus, $allowed, true)) {
            throw new Exception("Invalid status transition from '{$currentStatus}' to '{$newStatus}'.");
        }

        $oldStatus = $currentStatus;
        $complaint->status = $newStatus;

        if ($newStatus === 'Resolved') {
            $complaint->resolved_at = Carbon::now();
            if ($notes) {
                $complaint->resolution_notes = $notes;
            }
            if ($resolutionImage) {
                $complaint->resolution_image = $resolutionImage;
            }
        } elseif ($newStatus === 'In Progress' && $oldStatus === 'Resolved') {
            // Reopened
            $complaint->resolved_at = null;
        }

        $complaint->save();

        // Record in status history
        StatusHistory::create([
            'complaint_id' => $complaint->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by' => $user ? $user->id : null,
            'notes' => $notes ?: "Status changed from {$oldStatus} to {$newStatus}",
            'changed_at' => Carbon::now(),
        ]);

        // Trigger centralized notifications
        $this->notificationService->notifyComplaintStatusUpdated($complaint, $newStatus, $notes);

        return $complaint->fresh(['statusHistory.changer', 'department', 'category', 'user']);
    }
}
