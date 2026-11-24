<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->with('complaint:id,tracking_number,title,status')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found.',
            ], 404);
        }

        if ($notification->user_id !== $user->id) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to modify this notification.',
            ], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found.',
            ], 404);
        }

        if ($notification->user_id !== $user->id) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to delete this notification.',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully.',
        ]);
    }
}
