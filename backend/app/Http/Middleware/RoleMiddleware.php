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

        if (empty($roles) || in_array($user->role, $roles, true)) {
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
