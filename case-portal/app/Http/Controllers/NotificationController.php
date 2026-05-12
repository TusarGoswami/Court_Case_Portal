<?php

namespace App\Http\Controllers;

use App\Models\PortalNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $notifications = PortalNotification::where('user_id', (string) $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $notification = PortalNotification::where('_id', $id)
            ->where('user_id', (string) $user->id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read']);
    }
}
