<?php

namespace App\Http\Controllers;

use App\Models\Judge;
use App\Models\PortalNotification;
use App\Models\User;
use App\Support\JudgeProfilePresenter;
use App\Services\AuditLogger;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request, JwtService $jwtService, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:6', 'max:120', 'confirmed'],
            'role' => ['nullable', Rule::in(['admin', 'judge', 'lawyer', 'clerk', 'public_user'])],
            'phone' => ['required', 'string', 'max:30'],
            'terms_accepted' => ['required', 'accepted'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'public_user',
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        $token = $jwtService->generateToken($user);

        PortalNotification::create([
            'user_id' => (string) $user->id,
            'title' => 'Account created',
            'message' => 'Welcome to the E-Court portal.',
            'type' => 'auth',
            'metadata' => [],
        ]);

        $auditLogger->log('user.register', 'user', (string) $user->id, ['email' => $user->email], $request, (string) $user->id);

        return response()->json([
            'message' => 'User registered successfully.',
            'token' => $token,
            'user' => $this->sanitizeUser($user),
        ]);
    }

    public function login(Request $request, JwtService $jwtService, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower($validated['email']);
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Keep featured lawyer accounts mapped to the provided local images.
        $photoByEmail = [
            'jolly1@gmail.com' => '/images/Jagdishwar_Mishra.png',
            'jolly2@gmail.com' => '/images/Jagdish_Tyagi.png',
            'jolly3@gmail.com' => '/images/Rahman_Dakaait.png',
            'jolly4@gmail.com' => '/images/Tushar.png',
            'judge123@gmail.com' => '/images/Justice_Sunderlal_Tripathi.png',
        ];

        $photoByName = [
            'jagdishwar mishra' => '/images/Jagdishwar_Mishra.png',
            'jagdish tyagi' => '/images/Jagdish_Tyagi.png',
            'rahman dakaait' => '/images/Rahman_Dakaait.png',
            'tushar' => '/images/Tushar.png',
            'justice sunderlal tripathi' => '/images/Justice_Sunderlal_Tripathi.png',
        ];

        $expectedPhoto = $photoByEmail[$email] ?? $photoByName[strtolower((string) $user->name)] ?? null;
        if ($expectedPhoto && ($user->photo_url ?? null) !== $expectedPhoto) {
            $user->photo_url = $expectedPhoto;
            $user->save();
        }

        $token = $jwtService->generateToken($user);
        $auditLogger->log('user.login', 'user', (string) $user->id, [], $request, (string) $user->id);

        return response()->json([
            'message' => 'Login success',
            'token' => $token,
            'user' => $this->sanitizeUser($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->sanitizeUser($request->attributes->get('auth_user')),
        ]);
    }

    private function sanitizeUser(User $user): array
    {
        $photoByEmail = [
            'jolly1@gmail.com' => '/images/Jagdishwar_Mishra.png',
            'jolly2@gmail.com' => '/images/Jagdish_Tyagi.png',
            'jolly3@gmail.com' => '/images/Rahman_Dakaait.png',
            'jolly4@gmail.com' => '/images/Tushar.png',
            'judge123@gmail.com' => '/images/Justice_Sunderlal_Tripathi.png',
        ];

        $photoByName = [
            'jagdishwar mishra' => '/images/Jagdishwar_Mishra.png',
            'jagdish tyagi' => '/images/Jagdish_Tyagi.png',
            'rahman dakaait' => '/images/Rahman_Dakaait.png',
            'tushar' => '/images/Tushar.png',
            'justice sunderlal tripathi' => '/images/Justice_Sunderlal_Tripathi.png',
        ];

        $resolvedPhoto = $photoByEmail[strtolower((string) $user->email)]
            ?? $photoByName[strtolower((string) $user->name)]
            ?? ($user->photo_url ?? null);

        $payload = [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'photo_url' => $resolvedPhoto,
            'is_active' => (bool) $user->is_active,
        ];

        if (($user->role ?? '') === 'judge') {
            $bench = Judge::query()->where('user_id', (string) $user->id)->first()
                ?? Judge::query()->where('login_email', strtolower((string) $user->email))->first();
            if ($bench) {
                $payload['judge_profile'] = JudgeProfilePresenter::toArray($bench);
            }
        }

        return $payload;
    }
}