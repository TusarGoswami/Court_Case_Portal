<?php

namespace App\Http\Controllers;

use App\Models\CourtCase;
use App\Models\PortalNotification;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CourtCase::query();

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('case_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    // Support searching incident description if it's a dynamic case creation flow
                    ->orWhere('incident.description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        $cases = $query->orderBy('created_at', 'desc')->limit(100)->get()->map(function (CourtCase $caseFile) {
            return $this->transform($caseFile);
        });

        return response()->json(['data' => $cases]);
    }

    public function store(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $validated = $request->validate([
            'case_number' => ['required', 'string', 'max:60'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['required', 'string', 'max:5000'],
            'status' => ['required', Rule::in(['filed', 'under_review', 'scheduled', 'hearing_in_progress', 'judgment_reserved', 'closed', 'accepted', 'verified', 'assigned_to_judge', 'hearing_scheduled', 'judgment_pending'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'court_room' => ['nullable', 'string', 'max:80'],
            'filed_at' => ['nullable', 'date'],
            'next_hearing_at' => ['nullable', 'date'],
            'parties' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'assigned_judge_id' => ['nullable', 'string'],
            'assigned_clerk_id' => ['nullable', 'string'],
        ]);

        $caseFile = CourtCase::create([
            ...$validated,
            'created_by' => (string) $user->id,
            'priority' => $validated['priority'] ?? 'medium',
            'parties' => $validated['parties'] ?? [],
            'tags' => $validated['tags'] ?? [],
            'filed_at' => $validated['filed_at'] ?? now(),
        ]);

        PortalNotification::create([
            'user_id' => (string) $user->id,
            'title' => 'Case filed',
            'message' => "Case {$caseFile->case_number} has been created.",
            'type' => 'case',
            'metadata' => ['case_id' => (string) $caseFile->id],
        ]);

        $auditLogger->log('case.create', 'case_file', (string) $caseFile->id, $validated, $request, (string) $user->id);

        return response()->json([
            'message' => 'Case filed successfully.',
            'data' => $this->transform($caseFile),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $caseFile = CourtCase::find($id);

        if (!$caseFile) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        return response()->json(['data' => $this->transform($caseFile, true)]);
    }

    public function update(Request $request, string $id, AuditLogger $auditLogger): JsonResponse
    {
        $caseFile = CourtCase::find($id);
        $user = $request->attributes->get('auth_user');

        if (!$caseFile) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(['filed', 'under_review', 'scheduled', 'hearing_in_progress', 'judgment_reserved', 'closed', 'accepted', 'verified', 'assigned_to_judge', 'hearing_scheduled', 'judgment_pending'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'court_room' => ['nullable', 'string', 'max:80'],
            'next_hearing_at' => ['nullable', 'date'],
            'parties' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'assigned_judge_id' => ['nullable', 'string'],
            'assigned_clerk_id' => ['nullable', 'string'],
        ]);

        $caseFile->update($validated);
        $auditLogger->log('case.update', 'case_file', (string) $caseFile->id, $validated, $request, (string) $user->id);

        return response()->json([
            'message' => 'Case updated successfully.',
            'data' => $this->transform($caseFile->fresh()),
        ]);
    }

    public function statuses(): JsonResponse
    {
        return response()->json([
            'data' => ['filed', 'under_review', 'scheduled', 'hearing_in_progress', 'judgment_reserved', 'closed', 'accepted', 'verified', 'assigned_to_judge', 'hearing_scheduled', 'judgment_pending'],
        ]);
    }

    private function transform(CourtCase $caseFile, bool $withRelations = false): array
    {
        $pet = data_get($caseFile->complainant, 'name')
            ?: data_get($caseFile->complainant, 'full_name')
            ?: 'Petitioner';
        $resp = data_get($caseFile->accused, 'name')
            ?: data_get($caseFile->accused, 'full_name')
            ?: 'Respondent';
        $resolvedTitle = $caseFile->title ?? "{$pet} vs {$resp}";

        $resolvedDesc = $caseFile->description
            ?? $caseFile->relief_requested
            ?? data_get($caseFile->incident, 'description')
            ?? data_get($caseFile->incident, 'details')
            ?? data_get($caseFile->incident, 'summary')
            ?? '';

        $payload = [
            'id' => (string) $caseFile->id,
            'case_number' => $caseFile->case_number,
            'title' => $resolvedTitle,
            'description' => $resolvedDesc,
            'status' => $caseFile->status,
            'priority' => $caseFile->priority,
            'court_room' => $caseFile->court_room,
            'filed_at' => optional($caseFile->filed_at)->toISOString() ?? optional($caseFile->created_at)->toISOString(),
            'next_hearing_at' => optional($caseFile->next_hearing_at)->toISOString() ?? optional($caseFile->slot_time)->toISOString(),
            'slot_time' => optional($caseFile->next_hearing_at)->toISOString() ?? optional($caseFile->slot_time)->toISOString(),
            'parties' => $caseFile->parties ?? [],
            'tags' => $caseFile->tags ?? [],
            'created_by' => $caseFile->created_by,
            'assigned_judge_id' => $caseFile->assigned_judge_id ?? $caseFile->judge_id,
            'assigned_clerk_id' => $caseFile->assigned_clerk_id,
            'created_at' => optional($caseFile->created_at)->toISOString(),
            'updated_at' => optional($caseFile->updated_at)->toISOString(),
        ];

        if ($withRelations) {
            $payload['hearings'] = $caseFile->hearings()->orderBy('scheduled_at', 'asc')->get();
            $payload['documents'] = $caseFile->documents()->orderBy('created_at', 'desc')->get();
        }

        return $payload;
    }
}
