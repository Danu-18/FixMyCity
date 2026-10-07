<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $now = Carbon::now();
        $departments = Department::with('categories')
            ->withCount([
                'complaints as total_complaints',
                'complaints as pending_complaints' => function ($q) {
                    $q->where('status', 'Pending');
                },
                'complaints as in_progress_complaints' => function ($q) {
                    $q->where('status', 'In Progress');
                },
                'complaints as resolved_complaints' => function ($q) {
                    $q->where('status', 'Resolved');
                },
                'complaints as breached_complaints' => function ($q) use ($now) {
                    $q->whereNotIn('status', ['Resolved', 'Rejected'])
                      ->where('sla_deadline', '<', $now);
                },
                'staff as staff_count',
            ])
            ->get();

        return response()->json($departments);
    }

    public function show(int $id): JsonResponse
    {
        $department = Department::with(['categories', 'staff:id,name,email,role'])
            ->withCount('complaints')
            ->findOrFail($id);

        return response()->json($department);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_name' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'sla_hours' => 'required|integer|min:1',
        ]);

        $department = Department::create($validated);

        return response()->json([
            'message' => 'Department created successfully',
            'department' => $department,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'department_name' => 'sometimes|string|max:255',
            'contact_email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'sla_hours' => 'sometimes|integer|min:1',
        ]);

        $department->update($validated);

        return response()->json([
            'message' => 'Department updated successfully',
            'department' => $department,
        ]);
    }
}
