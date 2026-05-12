<?php

namespace App\Http\Controllers;

use App\Models\CaseFile;
use App\Models\PortalNotification;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CaseFile::query();

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('case_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        $cases = $query->orderBy('created_at', 'desc')->limit(100)->get()->map(function (CaseFile $caseFile) {
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
            'status' => ['required', Rule::in(['filed', 'under_review', 'scheduled', 'hearing_in_progress', 'judgment_reserved', 'closed'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'court_room' => ['nullable', 'string', 'max:80'],
            'filed_at' => ['nullable', 'date'],
            'next_hearing_at' => ['nullable', 'date'],
            'parties' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'assigned_judge_id' => ['nullable', 'string'],
            'assigned_clerk_id' => ['nullable', 'string'],
        ]);

        $caseFile = CaseFile::create([
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
        $caseFile = CaseFile::find($id);

        if (!$caseFile) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        return response()->json(['data' => $this->transform($caseFile, true)]);
    }

    public function update(Request $request, string $id, AuditLogger $auditLogger): JsonResponse
    {
        $caseFile = CaseFile::find($id);
        $user = $request->attributes->get('auth_user');

        if (!$caseFile) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(['filed', 'under_review', 'scheduled', 'hearing_in_progress', 'judgment_reserved', 'closed'])],
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
            'data' => ['filed', 'under_review', 'scheduled', 'hearing_in_progress', 'judgment_reserved', 'closed'],
        ]);
    }

    private function transform(CaseFile $caseFile, bool $withRelations = false): array
    {
        $payload = [
            'id' => (string) $caseFile->id,
            'case_number' => $caseFile->case_number,
            'title' => $caseFile->title,
            'description' => $caseFile->description,
            'status' => $caseFile->status,
            'priority' => $caseFile->priority,
            'court_room' => $caseFile->court_room,
            'filed_at' => optional($caseFile->filed_at)->toISOString(),
            'next_hearing_at' => optional($caseFile->next_hearing_at)->toISOString(),
            'parties' => $caseFile->parties ?? [],
            'tags' => $caseFile->tags ?? [],
            'created_by' => $caseFile->created_by,
            'assigned_judge_id' => $caseFile->assigned_judge_id,
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
