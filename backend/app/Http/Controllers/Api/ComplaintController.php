<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\StatusHistory;
use App\Models\Upvote;
use App\Services\ComplaintRoutingEngine;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ComplaintController extends Controller
{
    public function __construct(
        protected ComplaintRoutingEngine $routingEngine
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Complaint::with(['department', 'category', 'user:id,name,role']);

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tracking_number', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($status = $request->query('status')) {
            if ($status !== 'All') {
                $query->where('status', $status);
            }
        }

        if ($departmentId = $request->query('department_id')) {
            $query->where('department_id', $departmentId);
        }

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        // Current user complaints filter
        $currentUser = $request->user('sanctum');
        if ($request->boolean('mine') && $currentUser) {
            $query->where('user_id', $currentUser->id);
        }

        // SLA filter
        if ($slaFilter = $request->query('sla_status')) {
            $now = Carbon::now();
            if ($slaFilter === 'breached') {
                $query->whereNotIn('status', ['Resolved', 'Rejected'])
                      ->where('sla_deadline', '<', $now);
            } elseif ($slaFilter === 'nearing') {
                $query->whereNotIn('status', ['Resolved', 'Rejected'])
                      ->where('sla_deadline', '>=', $now)
                      ->where('sla_deadline', '<=', $now->copy()->addHours(12));
            } elseif ($slaFilter === 'on_track') {
                $query->whereNotIn('status', ['Resolved', 'Rejected'])
                      ->where('sla_deadline', '>', $now->copy()->addHours(12));
            }
        }

        // Sorting
        $sort = $request->query('sort', 'newest');
        if ($sort === 'most_upvoted') {
            $query->withCount('upvotes')->orderBy('upvotes_count', 'desc');
        } elseif ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } elseif ($sort === 'urgent') {
            $query->orderByRaw("CASE 
                WHEN priority = 'Urgent' THEN 1 
                WHEN priority = 'High' THEN 2 
                WHEN priority = 'Medium' THEN 3 
                ELSE 4 END ASC")
            ->orderBy('created_at', 'desc');
        } else {
            // Default newest
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 12);
        $complaints = $query->paginate($perPage);

        // Attach current user's upvoted status
        if ($currentUser) {
            $userUpvotedIds = Upvote::where('user_id', $currentUser->id)
                ->whereIn('complaint_id', $complaints->pluck('id'))
                ->pluck('complaint_id')
                ->toArray();

            $complaints->getCollection()->transform(function ($c) use ($userUpvotedIds) {
                $c->has_upvoted = in_array($c->id, $userUpvotedIds, true);
                return $c;
            });
        } else {
            $complaints->getCollection()->transform(function ($c) {
                $c->has_upvoted = false;
                return $c;
            });
        }

        return response()->json($complaints);
    }

    public function show(Request $request, string $idOrTracking): JsonResponse
    {
        $complaint = Complaint::where('id', $idOrTracking)
            ->orWhere('tracking_number', $idOrTracking)
            ->with([
                'department',
                'category',
                'user:id,name,role',
                'statusHistory.changer:id,name,role',
            ])
            ->first();

        if (!$complaint) {
            return response()->json(['message' => 'Complaint not found.'], 404);
        }

        $currentUser = $request->user('sanctum');
        $hasUpvoted = false;
        if ($currentUser) {
            $hasUpvoted = Upvote::where('complaint_id', $complaint->id)
                ->where('user_id', $currentUser->id)
                ->exists();
        }

        $complaint->has_upvoted = $hasUpvoted;

        return response()->json($complaint);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:255',
            'priority' => 'nullable|string|in:Low,Medium,High,Urgent',
            'image' => 'nullable|image|max:10240', // 10MB max
        ]);

        $user = $request->user('sanctum');

        // Resolve routing and SLA via State Machine Engine
        $routing = $this->routingEngine->resolveRouting((int) $validated['category_id'], $validated['priority'] ?? null);

        // Handle uploaded image
        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $imagePath = $file->store('complaints', 'public');
        }

        // Generate unique tracking number e.g. FMC-2026-XXXX
        $trackingNumber = 'FMC-' . date('Y') . '-' . strtoupper(Str::random(5));
        while (Complaint::where('tracking_number', $trackingNumber)->exists()) {
            $trackingNumber = 'FMC-' . date('Y') . '-' . strtoupper(Str::random(5));
        }

        $complaint = Complaint::create([
            'tracking_number' => $trackingNumber,
            'user_id' => $user ? $user->id : null,
            'category_id' => (int) $validated['category_id'],
            'department_id' => $routing['department_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'image_path' => $imagePath,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'address' => $validated['address'] ?? null,
            'status' => 'Pending',
            'priority' => $routing['priority'],
            'sla_deadline' => $routing['sla_deadline'],
        ]);

        // Record initial status in status_history
        StatusHistory::create([
            'complaint_id' => $complaint->id,
            'old_status' => null,
            'new_status' => 'Pending',
            'changed_by' => $user ? $user->id : null,
            'notes' => "Complaint filed and automatically mapped to {$routing['department_name']} via FixMyCity State-Machine routing engine.",
            'changed_at' => Carbon::now(),
        ]);

        // Auto upvote by reporting user if logged in
        if ($user) {
            Upvote::firstOrCreate([
                'complaint_id' => $complaint->id,
                'user_id' => $user->id,
            ]);
        }

        return response()->json([
            'message' => 'Complaint successfully submitted and routed to responsible department.',
            'complaint' => $complaint->fresh(['department', 'category', 'statusHistory', 'user']),
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::findOrFail($id);
        $user = $request->user();

        // Check department access if authority
        if ($user->role === 'authority' && $user->department_id !== $complaint->department_id) {
            return response()->json([
                'message' => 'Unauthorized: You can only update complaints assigned to your department.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:Pending,In Progress,Resolved,Rejected',
            'notes' => 'nullable|string|max:1000',
            'resolution_image' => 'nullable|image|max:10240',
        ]);

        $resolutionImagePath = null;
        if ($request->hasFile('resolution_image')) {
            $file = $request->file('resolution_image');
            $resolutionImagePath = $file->store('resolutions', 'public');
        }

        try {
            $updated = $this->routingEngine->transitionStatus(
                $complaint,
                $validated['status'],
                $user,
                $validated['notes'] ?? null,
                $resolutionImagePath
            );

            return response()->json([
                'message' => "Complaint status updated to {$validated['status']}.",
                'complaint' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function toggleUpvote(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::findOrFail($id);
        $user = $request->user();

        $existing = Upvote::where('complaint_id', $complaint->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $hasUpvoted = false;
        } else {
            Upvote::create([
                'complaint_id' => $complaint->id,
                'user_id' => $user->id,
            ]);
            $hasUpvoted = true;
        }

        $newCount = $complaint->upvotes()->count();

        return response()->json([
            'has_upvoted' => $hasUpvoted,
            'upvotes_count' => $newCount,
        ]);
    }
}
