<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('department')
            ->withCount('complaints')
            ->orderBy('category_name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'description' => 'nullable|string',
            'default_priority' => 'required|string|in:Low,Medium,High,Urgent',
            'sla_hours' => 'required|integer|min:1',
            'icon' => 'nullable|string|max:50',
        ]);

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category->load('department'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'category_name' => 'sometimes|string|max:255',
            'department_id' => 'sometimes|exists:departments,id',
            'description' => 'nullable|string',
            'default_priority' => 'sometimes|string|in:Low,Medium,High,Urgent',
            'sla_hours' => 'sometimes|integer|min:1',
            'icon' => 'nullable|string|max:50',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category->load('department'),
        ]);
    }
}
