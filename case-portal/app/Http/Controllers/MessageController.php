<?php

namespace App\Http\Controllers;

use App\Models\CourtCase;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function contacts(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $userId = (string) $user->id;

        $contacts = [];

        if (($user->role ?? null) === 'lawyer') {
            $lawyerIds = $this->lawyerIdentifiersForUser($userId, (string) ($user->email ?? ''));
            $cases = CourtCase::query()
                ->whereIn('lawyer_id', $lawyerIds)
                ->whereIn('status', ['accepted', 'closed', 'Accepted', 'Closed'])
                ->orderBy('created_at', 'desc')
                ->limit(200)
                ->get();

            foreach ($cases as $case) {
                $client = User::find((string) $case->created_by);
                if (!$client) {
                    continue;
                }
                $contacts[(string) $client->id] = [
                    'user_id' => (string) $client->id,
                    'name' => $client->name,
                    'role' => $client->role,
                    'photo_url' => $client->photo_url,
                    'case_id' => (string) $case->id,
                    'case_number' => $case->case_number,
                ];
            }
        } else {
            $cases = CourtCase::query()
                ->where('created_by', $userId)
                ->whereIn('status', ['accepted', 'closed', 'Accepted', 'Closed'])
                ->orderBy('created_at', 'desc')
                ->limit(200)
                ->get();

            foreach ($cases as $case) {
                $lawyer = User::find((string) $case->lawyer_id);
                if (!$lawyer) {
                    continue;
                }
                $contacts[(string) $lawyer->id] = [
                    'user_id' => (string) $lawyer->id,
                    'name' => $lawyer->name,
                    'role' => $lawyer->role,
                    'photo_url' => $lawyer->photo_url,
                    'case_id' => (string) $case->id,
                    'case_number' => $case->case_number,
                ];
            }
        }

        return response()->json(['data' => array_values($contacts)]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $userId = (string) $user->id;

        $request->validate([
            'receiver_id' => ['required', 'string'],
            'case_id' => ['nullable', 'string'],
        ]);

        $receiverId = (string) $request->query('receiver_id');
        $caseId = (string) $request->query('case_id', '');

        $query = Message::query()
            ->where(function ($q) use ($userId, $receiverId) {
                $q->where('sender_id', $userId)->where('receiver_id', $receiverId);
            })
            ->orWhere(function ($q) use ($userId, $receiverId) {
                $q->where('sender_id', $receiverId)->where('receiver_id', $userId);
            });

        if ($caseId !== '') {
            $query->where('case_id', $caseId);
        }

        $messages = $query->orderBy('created_at', 'asc')->limit(300)->get();

        return response()->json([
            'data' => $messages->map(fn (Message $m) => [
                'id' => (string) $m->id,
                'sender_id' => $m->sender_id,
                'receiver_id' => $m->receiver_id,
                'case_id' => $m->case_id,
                'message' => $m->message,
                'created_at' => optional($m->created_at)->toISOString(),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $userId = (string) $user->id;

        $validated = $request->validate([
            'receiver_id' => ['required', 'string'],
            'case_id' => ['nullable', 'string'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $message = Message::create([
            'sender_id' => $userId,
            'receiver_id' => (string) $validated['receiver_id'],
            'case_id' => $validated['case_id'] ?? null,
            'message' => trim((string) $validated['message']),
        ]);

        return response()->json([
            'message' => 'Message sent',
            'data' => [
                'id' => (string) $message->id,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'case_id' => $message->case_id,
                'message' => $message->message,
                'created_at' => optional($message->created_at)->toISOString(),
            ],
        ], 201);
    }

    private function lawyerIdentifiersForUser(string $userId, string $email): array
    {
        $ids = [$userId];
        $byEmail = [
            'jolly1@gmail.com' => 'jagdishwar',
            'jolly2@gmail.com' => 'jagdish',
            'jolly3@gmail.com' => 'rahman',
            'jolly4@gmail.com' => 'tushar',
        ];

        $key = $byEmail[strtolower($email)] ?? null;
        if ($key) {
            $ids[] = $key;
        }

        return array_values(array_unique($ids));
    }
}

