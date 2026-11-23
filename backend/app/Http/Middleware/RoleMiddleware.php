<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

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
                'message' => 'Unauthorized: Account is not active.',
            ], 403);
        }

        if (empty($roles) || in_array($user->role, $roles, true)) {
            return $next($request);
        }

        // Super Admin has access to admin and authority routes
        if ($user->role === 'super_admin' && (in_array('admin', $roles, true) || in_array('authority', $roles, true))) {
            return $next($request);
        }

        // Admins have access to authority routes
        if ($user->role === 'admin' && in_array('authority', $roles, true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Unauthorized: Insufficient role permissions.',
        ], 403);
    }
}
