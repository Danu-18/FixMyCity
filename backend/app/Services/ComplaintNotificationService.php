<?php

namespace App\Services;

use App\Mail\ComplaintLifecycleMail;
use App\Models\Complaint;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ComplaintNotificationService
{
    /**
     * Notify citizen and Super Admins upon initial complaint submission.
     */
    public function notifyComplaintSubmitted(Complaint $complaint): void
    {
        $complaint->loadMissing(['user', 'department', 'category']);

        // 1. Citizen Web Notification & Lifecycle Email
        if ($complaint->user_id) {
            Notification::create([
                'user_id' => $complaint->user_id,
                'complaint_id' => $complaint->id,
                'title' => "Complaint #{$complaint->tracking_number} Submitted",
                'message' => "Your complaint '{$complaint->title}' has been submitted and is currently under FixMyCity moderation review before public listing.",
                'type' => 'complaint_submitted',
            ]);

            $this->sendLifecycleEmail(
                $complaint,
                'submitted',
                'Under Moderation Review',
                "Thank you for reporting this civic issue. Your complaint #{$complaint->tracking_number} has been recorded and is currently awaiting moderation review by FixMyCity Super Administrators to verify authenticity.",
                null,
                'Once approved by a Super Administrator, your issue will be publicly listed and automatically routed to the municipal team for resolution.'
            );
        }

        // 2. Super Admin Web Notification ONLY (Do not notify other citizens or authorities yet)
        $superAdmins = User::where('role', 'super_admin')
            ->where('status', 'active')
            ->get();

        foreach ($superAdmins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'complaint_id' => $complaint->id,
                'title' => "New Complaint Pending Review #{$complaint->tracking_number}",
                'message' => "A new complaint '{$complaint->title}' in {$complaint->city} requires moderation review before publication.",
                'type' => 'moderation_review',
            ]);
        }
    }

    /**
     * Notify citizen and matching city departmental authorities upon Super Admin approval.
     */
    public function notifyComplaintApproved(Complaint $complaint): void
    {
        $complaint->loadMissing(['user', 'department', 'category']);

        // 1. Citizen Web Notification & Lifecycle Email
        if ($complaint->user_id) {
            $deptName = $complaint->department ? $complaint->department->department_name : 'Assigned Department';

            Notification::create([
                'user_id' => $complaint->user_id,
                'complaint_id' => $complaint->id,
                'title' => "Complaint #{$complaint->tracking_number} Approved",
                'message' => "Your complaint '{$complaint->title}' has been approved, is now public, and has been routed to {$deptName} in {$complaint->city}.",
                'type' => 'moderation_approved',
            ]);

            $this->sendLifecycleEmail(
                $complaint,
                'approved',
                'Approved & Routed to Department',
                "Great news! Your complaint #{$complaint->tracking_number} has been reviewed, approved by administrators, and published. It is now officially assigned to {$deptName} in {$complaint->city}.",
                null,
                'Department engineers have been notified and will inspect the issue within the designated SLA turnaround time.'
            );
        }

        // 2. Matching City Authority Staff Web Notification ONLY
        $staffMembers = User::where('role', 'authority')
            ->where('status', 'active')
            ->where('department_id', $complaint->department_id)
            ->where('city', $complaint->city)
            ->get();

        foreach ($staffMembers as $staff) {
            Notification::create([
                'user_id' => $staff->id,
                'complaint_id' => $complaint->id,
                'title' => "New Assigned Complaint: #{$complaint->tracking_number}",
                'message' => "A new complaint '{$complaint->title}' in {$complaint->city} has been approved and assigned to your department.",
                'type' => 'complaint_assigned',
            ]);
        }
    }

    /**
     * Notify citizen upon Super Admin moderation rejection.
     */
    public function notifyComplaintModerationRejected(Complaint $complaint, string $reason): void
    {
        $complaint->loadMissing(['user', 'department', 'category']);

        if ($complaint->user_id) {
            Notification::create([
                'user_id' => $complaint->user_id,
                'complaint_id' => $complaint->id,
                'title' => "Complaint #{$complaint->tracking_number} Rejected",
                'message' => "Your complaint '{$complaint->title}' did not pass moderation review. Reason: {$reason}",
                'type' => 'moderation_rejected',
            ]);

            $this->sendLifecycleEmail(
                $complaint,
                'rejected',
                'Moderation Rejected',
                "Your complaint #{$complaint->tracking_number} did not pass our community guidelines moderation review.",
                $reason,
                'Please review the rejection reason above. If you believe this was an error, you may file a revised complaint with complete details and appropriate civic imagery.'
            );
        }
    }

    /**
     * Notify citizen and departmental staff upon operational status updates.
     */
    public function notifyComplaintStatusUpdated(Complaint $complaint, string $newStatus, ?string $remarks = null): void
    {
        $complaint->loadMissing(['user', 'department', 'category']);

        // 1. Citizen Web Notification & Lifecycle Email
        if ($complaint->user_id) {
            $isResolved = ($newStatus === 'Resolved');

            $userMessage = $isResolved
                ? "Your complaint '{$complaint->title}' has been successfully resolved by municipal authorities." . ($remarks ? " Notes: {$remarks}" : '')
                : "Your complaint '{$complaint->title}' status has been updated to {$newStatus}." . ($remarks ? " Notes: {$remarks}" : '');

            Notification::create([
                'user_id' => $complaint->user_id,
                'complaint_id' => $complaint->id,
                'title' => "Complaint #{$complaint->tracking_number} Status: {$newStatus}",
                'message' => $userMessage,
                'type' => 'status_change',
            ]);

            $stageTitle = $isResolved ? 'Issue Resolved' : "Status: {$newStatus}";

            $emailBody = $isResolved
                ? "Municipal authority personnel have resolved your complaint #{$complaint->tracking_number}. Thank you for helping keep our city clean and functional!"
                : "The status of your complaint #{$complaint->tracking_number} has been updated to '{$newStatus}'.";

            $nextStep = $isResolved
                ? 'No further action is required. If the civic issue reoccurs, you may file a new report or review resolution details.'
                : 'The assigned municipal department is actively working within the mandated SLA turnaround window.';

            $this->sendLifecycleEmail(
                $complaint,
                $isResolved ? 'resolved' : 'status_updated',
                $stageTitle,
                $emailBody,
                $remarks,
                $nextStep
            );
        }

        // 2. Matching City Authority Staff Web Notification
        $staffMembers = User::where('role', 'authority')
            ->where('status', 'active')
            ->where('department_id', $complaint->department_id)
            ->where('city', $complaint->city)
            ->get();

        foreach ($staffMembers as $staff) {
            Notification::create([
                'user_id' => $staff->id,
                'complaint_id' => $complaint->id,
                'title' => "Complaint #{$complaint->tracking_number} Updated to {$newStatus}",
                'message' => "Complaint '{$complaint->title}' status was updated to '{$newStatus}'.",
                'type' => 'status_change',
            ]);
        }
    }

    /**
     * Safe synchronous mail dispatch helper with error handling.
     */
    protected function sendLifecycleEmail(
        Complaint $complaint,
        string $stage,
        string $stageTitle,
        string $messageBody,
        ?string $remarks = null,
        ?string $nextStep = null
    ): void {
        if (!$complaint->user || empty($complaint->user->email)) {
            return;
        }

        try {
            Mail::to($complaint->user->email)->send(
                new ComplaintLifecycleMail(
                    $complaint,
                    $stage,
                    $stageTitle,
                    $messageBody,
                    $remarks,
                    $nextStep
                )
            );
        } catch (\Throwable $e) {
            Log::warning("Complaint lifecycle email could not be sent to {$complaint->user->email}: " . $e->getMessage());
        }
    }
}
