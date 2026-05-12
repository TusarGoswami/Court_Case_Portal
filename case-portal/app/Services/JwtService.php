<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Carbon;

class JwtService
{
    public function generateToken(User $user): string
    {
        $issuedAt = Carbon::now()->timestamp;
        $expiresAt = Carbon::now()->addHours(12)->timestamp;

        $payload = [
            'iss' => config('app.name'),
            'sub' => (string) $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ];

        return JWT::encode($payload, $this->jwtSecret(), 'HS256');
    }

    public function decodeToken(string $token): object
    {
        return JWT::decode($token, new Key($this->jwtSecret(), 'HS256'));
    }

    private function jwtSecret(): string
    {
        $appKey = config('app.key', '');

        if (str_starts_with($appKey, 'base64:')) {
            return base64_decode(substr($appKey, 7)) ?: $appKey;
        }

        return $appKey;
    }
}
