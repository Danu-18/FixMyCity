<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Notification;
use App\Models\User;
use App\Services\ComplaintNotificationService;
use App\Services\ComplaintRoutingEngine;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminController extends Controller
{
    /**
     * List all pending authority/municipal staff registrations.
     */
    public function pendingStaff(): JsonResponse
    {
        $pendingStaff = User::where('role', 'authority')
            ->where('status', 'pending')
            ->with('department')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($pendingStaff);
    }

    /**
     * Securely stream/download verification document for inspection.
     */
    public function viewDocument(int $id): Response
    {
        $user = User::where('id', $id)
            ->where('role', 'authority')
            ->firstOrFail();

        if (!$user->verification_document_path || !Storage::disk('local')->exists($user->verification_document_path)) {
            return response()->json([
                'message' => 'Verification document not found.',
            ], 404);
        }

        return Storage::disk('local')->response($user->verification_document_path);
    }

    /**
     * Approve pending municipal staff member.
     */
    public function approveStaff(Request $request, int $id): JsonResponse
    {
        $user = User::where('id', $id)
            ->where('role', 'authority')
            ->firstOrFail();

        $user->update([
            'status' => 'active',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Municipal staff account approved successfully.',
            'user' => $user->load(['department', 'approver']),
        ]);
    }

    /**
     * Reject pending municipal staff member.
     */
    public function rejectStaff(Request $request, int $id): JsonResponse
    {
        $user = User::where('id', $id)
            ->where('role', 'authority')
            ->firstOrFail();

        $user->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'message' => 'Municipal staff registration request rejected.',
            'user' => $user->load('department'),
        ]);
    }

    /**
     * List all complaints awaiting moderation review or flagged for abuse.
     */
    public function moderationQueue(): JsonResponse
    {
        $complaints = Complaint::where('moderation_status', 'pending_review')
            ->orWhere('is_flagged', true)
            ->with([
                'department:id,department_name',
                'category:id,category_name',
                'user:id,name,email',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($complaints);
    }

    /**
     * Approve and publish a complaint.
     */
    public function approveComplaint(
        Request $request,
        int $id,
        ComplaintRoutingEngine $routingEngine,
        ComplaintNotificationService $notificationService
    ): JsonResponse {
        $complaint = Complaint::findOrFail($id);

        // Recompute SLA deadline starting from approval time so SLA is not penalized by moderation queue wait
        $routing = $routingEngine->resolveRouting($complaint->category_id, $complaint->priority);

        $complaint->update([
            'moderation_status' => 'approved',
            'is_flagged' => false,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'sla_deadline' => $routing['sla_deadline'],
        ]);

        // Centralized citizen + matching city authority notification & email dispatch
        $notificationService->notifyComplaintApproved($complaint);

        return response()->json([
            'message' => 'Complaint approved and published successfully.',
            'complaint' => $complaint->fresh(['department', 'category', 'user', 'moderator']),
        ]);
    }

    /**
     * Reject an inappropriate complaint with a required reason.
     */
    public function rejectComplaint(
        Request $request,
        int $id,
        ComplaintNotificationService $notificationService
    ): JsonResponse {
        $complaint = Complaint::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $complaint->update([
            'moderation_status' => 'rejected',
            'moderation_reason' => $validated['reason'],
            'is_flagged' => false,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ]);

        // Centralized citizen rejection notification & email dispatch
        $notificationService->notifyComplaintModerationRejected($complaint, $validated['reason']);

        return response()->json([
            'message' => 'Complaint has been rejected.',
            'complaint' => $complaint->fresh(['department', 'category', 'user', 'moderator']),
        ]);
    }
}
