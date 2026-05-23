<?php

namespace App\Http\Controllers;

use App\Models\CourtCase;
use App\Models\Hearing;
use App\Models\PortalNotification;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HearingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Hearing::query();

        if ($request->filled('case_id')) {
            $query->where('case_file_id', $request->query('case_id'));
        }

        $hearings = $query->orderBy('scheduled_at', 'asc')->limit(200)->get();

        return response()->json(['data' => $hearings]);
    }

    public function store(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $validated = $request->validate([
            'case_file_id' => ['required', 'string'],
            'title' => ['required', 'string', 'max:150'],
            'agenda' => ['nullable', 'string', 'max:2000'],
            'scheduled_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:480'],
            'location' => ['nullable', 'string', 'max:120'],
            'meeting_link' => ['nullable', 'url', 'max:240'],
            'status' => ['nullable', Rule::in(['scheduled', 'completed', 'adjourned', 'cancelled'])],
        ]);

        $caseFile = CourtCase::find($validated['case_file_id']);

        if (!$caseFile) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        $hearing = Hearing::create([
            ...$validated,
            'duration_minutes' => $validated['duration_minutes'] ?? 30,
            'status' => $validated['status'] ?? 'scheduled',
            'created_by' => (string) $user->id,
        ]);

        $caseFile->update(['next_hearing_at' => $hearing->scheduled_at, 'status' => 'scheduled']);

        PortalNotification::create([
            'user_id' => (string) $user->id,
            'title' => 'Hearing scheduled',
            'message' => "Hearing for case {$caseFile->case_number} is set for {$hearing->scheduled_at}.",
            'type' => 'hearing',
            'metadata' => ['case_id' => (string) $caseFile->id, 'hearing_id' => (string) $hearing->id],
        ]);

        $auditLogger->log('hearing.create', 'hearing', (string) $hearing->id, $validated, $request, (string) $user->id);

        return response()->json(['message' => 'Hearing scheduled.', 'data' => $hearing], 201);
    }
}
