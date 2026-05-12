<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var JwtService $jwtService */
        $jwtService = app(JwtService::class);

        $header = (string) $request->header('Authorization');

        if (!str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $token = substr($header, 7);

        try {
            $payload = $jwtService->decodeToken($token);
            $user = User::find((string) $payload->sub);

            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->attributes->set('auth_user', $user);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid or expired token'], 401);
        }

        return $next($request);
    }
}
