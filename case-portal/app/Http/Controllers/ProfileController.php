<?php

namespace App\Http\Controllers;

use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function uploadPhoto(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $request->validate([
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('photo')->store('profile-photos', 'public');
        $url = Storage::disk('public')->url($path);

        $user->update(['photo_url' => $url]);

        $auditLogger->log('user.photo.upload', 'user', (string) $user->id, ['photo_url' => $url], $request, (string) $user->id);

        return response()->json([
            'message' => 'Profile photo updated.',
            'photo_url' => $url,
        ]);
    }
}
