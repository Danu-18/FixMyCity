<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CitizenVerificationCodeMail;
use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
        $code = (string) random_int(100000, 999999);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
            'role' => 'citizen',
            'status' => 'active',
            'department_id' => null,
            'email_verified_at' => null,
            'email_verification_code' => Hash::make($code),
            'email_verification_expires_at' => now()->addMinutes(15),
        ]);

        Mail::to($user->email)->send(new CitizenVerificationCodeMail($code, 15));

        return response()->json([
            'message' => 'A 6-digit verification code has been sent to your email.',
            'requires_verification' => true,
            'email' => $user->email,
        ], 201);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        if ($user->email_verified_at !== null) {
            return response()->json([
                'message' => 'Email is already verified.',
                'user' => $user->load('department'),
                'token' => $user->createToken('auth_token')->plainTextToken,
            ]);
        }

        if (
            empty($user->email_verification_code) ||
            empty($user->email_verification_expires_at) ||
            now()->isAfter($user->email_verification_expires_at) ||
            !Hash::check($request->code, $user->email_verification_code)
        ) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        $user->update([
            'email_verified_at' => now(),
            'email_verification_code' => null,
            'email_verification_expires_at' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user->load('department'),
            'token' => $token,
        ]);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'No account found with this email address.',
            ], 404);
        }

        if ($user->email_verified_at !== null) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 400);
        }

        $code = (string) random_int(100000, 999999);

        $user->update([
            'email_verification_code' => Hash::make($code),
            'email_verification_expires_at' => now()->addMinutes(15),
        ]);

        Mail::to($user->email)->send(new CitizenVerificationCodeMail($code, 15));

        return response()->json([
            'message' => 'A fresh 6-digit verification code has been sent to your email.',
            'requires_verification' => true,
            'email' => $user->email,
        ]);
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

        // Enforce citizen email verification check
        if ($user->role === 'citizen' && $user->email_verified_at === null) {
            return response()->json([
                'message' => 'Please verify your email address before logging in.',
                'requires_verification' => true,
                'email' => $user->email,
            ], 403);
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

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'No account found with this email address.',
            ], 404);
        }

        $code = (string) random_int(100000, 999999);

        $user->update([
            'password_reset_code' => Hash::make($code),
            'password_reset_expires_at' => now()->addMinutes(15),
        ]);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        try {
            Mail::to($user->email)->send(new PasswordResetCodeMail($code, 15));
        } catch (\Throwable $e) {
            Log::warning("Password reset email could not be sent to {$user->email}: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'A 6-digit password reset code has been sent to your email.',
            'email' => $user->email,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired password reset code.',
            ], 422);
        }

        if (
            empty($user->password_reset_code) ||
            empty($user->password_reset_expires_at) ||
            now()->isAfter($user->password_reset_expires_at) ||
            !Hash::check($request->code, $user->password_reset_code)
        ) {
            return response()->json([
                'message' => 'Invalid or expired password reset code.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_reset_code' => null,
            'password_reset_expires_at' => null,
        ]);

        // Revoke active sessions for security
        $user->tokens()->delete();

        // Remove token record
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return response()->json([
            'message' => 'Your password has been successfully reset. You can now log in with your new password.',
        ]);
    }
}
