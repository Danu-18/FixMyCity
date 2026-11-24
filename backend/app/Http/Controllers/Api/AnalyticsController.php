<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Complaint;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $city = $request->query('city');
        $currentUser = $request->user('sanctum');
        if ($currentUser && $currentUser->isAuthority() && !empty($currentUser->city)) {
            $city = $currentUser->city;
        }

        $baseComplaintQuery = Complaint::where('moderation_status', 'approved');
        if ($city) {
            $baseComplaintQuery->where('city', $city);
        }

        $totalComplaints = (clone $baseComplaintQuery)->count();
        $statusCounts = (clone $baseComplaintQuery)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $pending = 0;
        $inProgress = 0;
        $resolved = 0;
        $rejected = 0;

        foreach ($statusCounts as $statusName => $count) {
            $lower = strtolower(trim((string) $statusName));
            if ($lower === 'pending') $pending += (int) $count;
            elseif ($lower === 'in progress') $inProgress += (int) $count;
            elseif ($lower === 'resolved') $resolved += (int) $count;
            elseif ($lower === 'rejected') $rejected += (int) $count;
        }

        $now = Carbon::now();

        // SLA compliance calculation: evaluate all complaints that have an SLA target
        // A complaint meets its SLA target if:
        // 1. It is Resolved and resolved_at <= sla_deadline
        // 2. Or it is active (Pending / In Progress) and sla_deadline >= now (not overdue)
        $complaintsWithSla = (clone $baseComplaintQuery)
            ->whereNotNull('sla_deadline')
            ->get();

        $totalEvaluated = $complaintsWithSla->count();
        $compliantCount = 0;
        $resolvedCount = 0;
        $totalResolutionHours = 0;

        foreach ($complaintsWithSla as $c) {
            $statusLower = strtolower(trim((string) $c->status));
            $isResolved = $statusLower === 'resolved';

            $slaDeadline = $c->sla_deadline ? Carbon::parse($c->sla_deadline) : null;
            $resolvedAt = $c->resolved_at ? Carbon::parse($c->resolved_at) : null;
            $createdAt = $c->created_at ? Carbon::parse($c->created_at) : null;

            if ($isResolved) {
                $resolvedCount++;
                if ($resolvedAt && $createdAt) {
                    $totalResolutionHours += $createdAt->diffInHours($resolvedAt);
                }

                // If resolved_at is missing or resolved before/at deadline, SLA was met
                if (!$slaDeadline || !$resolvedAt || $resolvedAt->lte($slaDeadline)) {
                    $compliantCount++;
                }
            } else {
                // Active complaints (Pending / In Progress) meet SLA if deadline is in the future
                if (!$slaDeadline || $slaDeadline->gte($now)) {
                    $compliantCount++;
                }
            }
        }

        $avgResolutionHours = $resolvedCount > 0
            ? round($totalResolutionHours / $resolvedCount, 1)
            : 0;

        $slaComplianceRate = $totalEvaluated > 0
            ? round(($compliantCount / $totalEvaluated) * 100, 1)
            : 100.0;

        // Active SLA breaches
        $activeBreachedCount = (clone $baseComplaintQuery)->whereIn('status', ['Pending', 'In Progress'])
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', $now)
            ->count();

        // Department breakdown
        $departments = Department::withCount(['complaints' => function ($q) use ($city) {
                $q->where('moderation_status', 'approved');
                if ($city) {
                    $q->where('city', $city);
                }
            }])
            ->get()
            ->map(function ($d) use ($now, $city) {
                $deptQuery = Complaint::where('moderation_status', 'approved')->where('department_id', $d->id);
                if ($city) {
                    $deptQuery->where('city', $city);
                }

                $resolved = (clone $deptQuery)->where('status', 'Resolved')->count();
                $breached = (clone $deptQuery)
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
        $categories = Category::withCount(['complaints' => function ($q) use ($city) {
                $q->where('moderation_status', 'approved');
                if ($city) {
                    $q->where('city', $city);
                }
            }])
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
