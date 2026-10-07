<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Complaint;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalComplaints = Complaint::count();
        $statusCounts = Complaint::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $pending = $statusCounts['Pending'] ?? 0;
        $inProgress = $statusCounts['In Progress'] ?? 0;
        $resolved = $statusCounts['Resolved'] ?? 0;
        $rejected = $statusCounts['Rejected'] ?? 0;

        $now = Carbon::now();

        // SLA compliance calculation
        $resolvedComplaints = Complaint::where('status', 'Resolved')
            ->whereNotNull('sla_deadline')
            ->whereNotNull('resolved_at')
            ->get();

        $resolvedWithinSla = 0;
        $totalResolutionHours = 0;

        foreach ($resolvedComplaints as $c) {
            if ($c->resolved_at <= $c->sla_deadline) {
                $resolvedWithinSla++;
            }
            $hours = $c->created_at->diffInHours($c->resolved_at);
            $totalResolutionHours += $hours;
        }

        $avgResolutionHours = $resolvedComplaints->count() > 0
            ? round($totalResolutionHours / $resolvedComplaints->count(), 1)
            : 0;

        $slaComplianceRate = $resolvedComplaints->count() > 0
            ? round(($resolvedWithinSla / $resolvedComplaints->count()) * 100, 1)
            : 100.0;

        // Active SLA breaches
        $activeBreachedCount = Complaint::whereIn('status', ['Pending', 'In Progress'])
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', $now)
            ->count();

        // Department breakdown
        $departments = Department::withCount('complaints')
            ->get()
            ->map(function ($d) use ($now) {
                $resolved = Complaint::where('department_id', $d->id)->where('status', 'Resolved')->count();
                $breached = Complaint::where('department_id', $d->id)
                    ->whereIn('status', ['Pending', 'In Progress'])
                    ->where('sla_deadline', '<', $now)
                    ->count();

                return [
                    'id' => $d->id,
                    'name' => $d->department_name,
                    'total' => $d->complaints_count,
                    'resolved' => $resolved,
                    'breached' => $breached,
                    'sla_target_hours' => $d->sla_hours,
                ];
            });

        // Category distribution
        $categories = Category::withCount('complaints')
            ->orderBy('complaints_count', 'desc')
            ->take(8)
            ->get()
            ->map(fn($c) => [
                'name' => $c->category_name,
                'count' => $c->complaints_count,
            ]);

        return response()->json([
            'summary' => [
                'total_complaints' => $totalComplaints,
                'pending' => $pending,
                'in_progress' => $inProgress,
                'resolved' => $resolved,
                'rejected' => $rejected,
                'active_breached' => $activeBreachedCount,
                'sla_compliance_rate' => $slaComplianceRate,
                'avg_resolution_hours' => $avgResolutionHours,
            ],
            'departments' => $departments,
            'categories' => $categories,
        ]);
    }
}
