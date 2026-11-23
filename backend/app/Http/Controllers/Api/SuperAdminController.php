<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
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
}
