<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeatmapController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Complaint::with(['department:id,department_name', 'category:id,category_name'])
            ->select([
                'id',
                'tracking_number',
                'title',
                'category_id',
                'department_id',
                'latitude',
                'longitude',
                'status',
                'priority',
                'address',
                'image_path',
                'sla_deadline',
                'created_at',
            ]);

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

        $complaints = $query->get();

        // Format points for Leaflet.heat ([lat, lng, intensity]) and detail markers
        $points = $complaints->map(function ($c) {
            $baseWeight = match ($c->priority) {
                'Urgent' => 1.0,
                'High' => 0.8,
                'Medium' => 0.5,
                default => 0.3,
            };

            // Factor in upvotes
            $upvoteBonus = min(0.5, ($c->upvotes_count * 0.05));
            $intensity = min(1.0, $baseWeight + $upvoteBonus);

            return [
                'id' => $c->id,
                'tracking_number' => $c->tracking_number,
                'title' => $c->title,
                'lat' => (float) $c->latitude,
                'lng' => (float) $c->longitude,
                'intensity' => round($intensity, 2),
                'category' => $c->category ? $c->category->category_name : 'General',
                'department' => $c->department ? $c->department->department_name : 'General',
                'status' => $c->status,
                'priority' => $c->priority,
                'address' => $c->address,
                'image_url' => $c->image_url,
                'upvotes_count' => $c->upvotes_count,
                'is_sla_breached' => $c->is_sla_breached,
                'created_at' => $c->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'total' => $points->count(),
            'points' => $points,
        ]);
    }
}
