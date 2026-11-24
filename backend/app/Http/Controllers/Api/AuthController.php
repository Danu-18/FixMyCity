<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:30',
            'city' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:citizen,authority', // Explicitly block super_admin and admin
        ];

        $role = $request->input('role', 'citizen');

        if ($role === 'authority') {
            $rules['department_id'] = 'required|exists:departments,id';
            $rules['city'] = 'required|string|max:100';
            $rules['verification_document'] = 'required|file|mimes:pdf,jpg,jpeg,png|max:5120';
        }

        $validated = $request->validate($rules);

        if ($role === 'authority') {
            $path = $request->file('verification_document')->store('verifications', 'local');

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'city' => $validated['city'],
                'role' => 'authority',
                'status' => 'pending', // Forced pending; Super Admin approval required
                'department_id' => $validated['department_id'],
                'verification_document_path' => $path,
            ]);

            return response()->json([
                'message' => 'Your municipal staff account registration has been submitted and is pending Super Admin approval.',
                'user' => $user->load('department'),
                'token' => null,
            ], 201);
        }

        // Citizen registration
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
            'role' => 'citizen',
            'status' => 'active',
            'department_id' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Enforce account status check
        if ($user->status === 'pending') {
            return response()->json([
                'message' => 'Your municipal staff account is pending Super Admin approval.',
            ], 403);
        }

        if ($user->status === 'rejected') {
            return response()->json([
                'message' => 'Your staff registration request was rejected.',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is not active.',
            ], 403);
        }

        // Revoke old tokens if any (clean session)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => $user->load('department'),
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load(['department', 'approver']),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }
}
