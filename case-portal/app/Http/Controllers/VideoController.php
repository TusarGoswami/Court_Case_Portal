<?php

namespace App\Http\Controllers;

use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function token(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $apiKey = (string) env('STREAM_API_KEY', '');
        $apiSecret = (string) env('STREAM_API_SECRET', '');

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($apiKey === '' || $apiSecret === '') {
            return response()->json([
                'message' => 'Stream API credentials are not configured on backend.',
            ], 422);
        }

        $issuedAt = time();
        $expiresAt = $issuedAt + (60 * 60 * 2);

        $token = JWT::encode([
            'user_id' => (string) $user->id,
            'role' => 'user',
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ], $apiSecret, 'HS256');

        return response()->json([
            'data' => [
                'apiKey' => $apiKey,
                'token' => $token,
                'user' => [
                    'id' => (string) $user->id,
                    'name' => (string) $user->name,
                    'image' => $user->photo_url ?? null,
                ],
            ],
        ]);
    }
}

