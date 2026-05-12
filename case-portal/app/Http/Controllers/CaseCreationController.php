<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CourtCase;
use App\Models\Judge;
use App\Models\PortalNotification;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CaseCreationController extends Controller
{
    public function lawyerCaseRequests(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $lawyerIds = $this->lawyerIdentifiersForUser((string) $user->id, (string) ($user->email ?? ''));

        $cases = CourtCase::query()
            ->whereIn('lawyer_id', $lawyerIds)
            ->whereIn('status', ['Pending', 'pending', 'filed'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (CourtCase $case) => $this->transformCase($case));

        return response()->json(['data' => $cases]);
    }

    public function respondToCaseRequest(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $validated = $request->validate([
            'action' => ['required', Rule::in(['accept', 'reject'])],
        ]);

        $lawyerIds = $this->lawyerIdentifiersForUser((string) $user->id, (string) ($user->email ?? ''));
        $case = CourtCase::find($id);

        if (!$case || !in_array((string) $case->lawyer_id, $lawyerIds, true)) {
            return response()->json(['message' => 'Case request not found'], 404);
        }

        if (!in_array(strtolower((string) $case->status), ['pending', 'filed'], true)) {
            return response()->json(['message' => 'Case request is already processed'], 409);
        }

        $status = $validated['action'] === 'accept' ? 'accepted' : 'rejected';
        $case->update([
            'status' => $status,
            // On accept, bind lawyerId to current logged-in lawyer.
            'lawyer_id' => $validated['action'] === 'accept' ? (string) $user->id : (string) $case->lawyer_id,
        ]);

        $case = $case->fresh();
        if ($validated['action'] === 'accept' && $case->judge_id && empty($case->judge_user_id)) {
            $assignedJudge = Judge::find($case->judge_id);
            if ($assignedJudge && !empty($assignedJudge->user_id)) {
                $case->update(['judge_user_id' => (string) $assignedJudge->user_id]);
                $case = $case->fresh();
            }
        }

        PortalNotification::create([
            'user_id' => (string) $case->created_by,
            'title' => $validated['action'] === 'accept' ? 'Case accepted by lawyer' : 'Case declined by lawyer',
            'message' => $validated['action'] === 'accept'
                ? "Your case {$case->case_number} has been accepted by your selected lawyer."
                : "Your case {$case->case_number} has been declined by the selected lawyer.",
            'type' => 'case',
            'metadata' => [
                'case_id' => (string) $case->id,
                'case_number' => $case->case_number,
                'action' => $validated['action'],
            ],
        ]);

        if ($validated['action'] === 'accept' && $case->judge_id) {
            $judgeRecipient = null;
            if (!empty($case->judge_user_id)) {
                $judgeRecipient = (string) $case->judge_user_id;
            } elseif ($linkedJudge = Judge::find($case->judge_id)) {
                $judgeRecipient = $linkedJudge->user_id ? (string) $linkedJudge->user_id : null;
            }
            if ($judgeRecipient) {
                PortalNotification::create([
                    'user_id' => $judgeRecipient,
                    'title' => 'New Case Assigned Successfully',
                    'message' => "Case {$case->case_number} has been accepted and is now assigned to your bench roster.",
                    'type' => 'case',
                    'metadata' => [
                        'case_id' => (string) $case->id,
                        'case_number' => $case->case_number,
                        'court_case' => true,
                    ],
                ]);
            }
        }

        return response()->json([
            'message' => $validated['action'] === 'accept' ? 'Case accepted successfully' : 'Case declined successfully',
            'data' => $this->transformCase($case->fresh()),
        ]);
    }

    public function myCases(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $query = CourtCase::query();

        if (($user->role ?? null) === 'lawyer') {
            // Lawyer portal should show cases assigned to the lawyer.
            // We support both real user IDs and featured lawyer keys used by the filing flow.
            $lawyerIdentifiers = $this->lawyerIdentifiersForUser((string) $user->id, (string) ($user->email ?? ''));
            $query->whereIn('lawyer_id', $lawyerIdentifiers);
        } else {
            // Public users see only their own submitted cases.
            $query->where('created_by', (string) $user->id);
        }

        $cases = $query
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (CourtCase $case) => $this->transformCase($case));

        return response()->json(['data' => $cases]);
    }
    public function bookSlot(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $validated = $request->validate([
            'lawyer_id' => ['required', 'string'],
            'slot_time' => ['required', 'date'],
        ]);

        $slot = Carbon::parse($validated['slot_time'])->seconds(0);

        $exists = Booking::query()
            ->where('lawyer_id', $validated['lawyer_id'])
            ->where('slot_time', $slot)
            ->whereIn('status', ['reserved', 'confirmed'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Slot already booked'], 409);
        }

        $booking = Booking::create([
            'lawyer_id' => $validated['lawyer_id'],
            'user_id' => (string) $user->id,
            'date' => $slot->format('Y-m-d'),
            'time' => $slot->format('H:i'),
            'slot_time' => $slot,
            'status' => 'reserved',
        ]);

        $auditLogger->log('booking.reserve', 'booking', (string) $booking->id, $validated, $request, (string) $user->id);

        return response()->json([
            'message' => 'Slot reserved',
            'data' => $booking,
        ], 201);
    }

    public function createCase(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $validated = $request->validate([
            'case_type' => ['required', Rule::in(['Civil', 'Criminal'])],
            'category' => ['required', 'string', 'max:120'],
            'jurisdiction' => ['required', 'string', 'max:120'],

            'complainant' => ['required'],
            'accused' => ['required'],
            'incident' => ['required'],
            'witnesses' => ['nullable'],
            'relief_requested' => ['nullable', 'string', 'max:5000'],

            'lawyer_id' => ['required', 'string'],
            'booking_id' => ['required', 'string'],

            'declaration' => ['required'],
        ]);

        $booking = Booking::find($validated['booking_id']);
        if (!$booking || $booking->user_id !== (string) $user->id) {
            return response()->json(['message' => 'Invalid booking'], 422);
        }
        if ($booking->status !== 'reserved') {
            return response()->json(['message' => 'Booking is not reservable'], 409);
        }
        if ($booking->lawyer_id !== $validated['lawyer_id']) {
            return response()->json(['message' => 'Booking lawyer mismatch'], 422);
        }

        if (CourtCase::query()->where('booking_id', (string) $booking->id)->exists()) {
            return response()->json(['message' => 'A case already exists for this booking. Duplicate filing blocked.'], 409);
        }

        $complainant = $this->asArray($validated['complainant']);
        $accused = $this->asArray($validated['accused']);
        $incident = $this->asArray($validated['incident']);
        $witnesses = $request->input('witnesses') ? $this->asArray($validated['witnesses']) : [];
        $declaration = $this->asArray($validated['declaration']);

        $idProofPath = null;
        if ($request->hasFile('id_proof')) {
            $idProofPath = $request->file('id_proof')->store('case-files/id-proofs', 'public');
        }

        $evidencePaths = [];
        if ($request->hasFile('evidence')) {
            foreach ($request->file('evidence') as $file) {
                $evidencePaths[] = $file->store('case-files/evidence', 'public');
            }
        }

        $judge = $this->allocateJudge($validated['jurisdiction'], $validated['case_type']);

        $caseNumber = $this->generateCaseNumber();

        $case = CourtCase::create([
            'case_number' => $caseNumber,
            'status' => 'filed',
            'case_type' => $validated['case_type'],
            'category' => $validated['category'],
            'jurisdiction' => $validated['jurisdiction'],
            'incident' => $incident,
            'complainant' => $complainant,
            'accused' => $accused,
            'witnesses' => $witnesses,
            'relief_requested' => $validated['relief_requested'] ?? null,
            'declaration' => $declaration,
            'evidence_files' => $evidencePaths,
            'id_proof_file' => $idProofPath,
            'lawyer_id' => $validated['lawyer_id'],
            'judge_id' => $judge ? (string) $judge->id : null,
            'judge_user_id' => $judge && !empty($judge->user_id) ? (string) $judge->user_id : null,
            'priority' => 'medium',
            'booking_id' => (string) $booking->id,
            'slot_time' => $booking->slot_time,
            'created_by' => (string) $user->id,
        ]);

        $booking->update([
            'status' => 'confirmed',
            'case_id' => (string) $case->id,
        ]);

        if ($judge) {
            $judge->update(['active_cases_count' => max(0, (int) $judge->active_cases_count) + 1]);
        }

        PortalNotification::create([
            'user_id' => (string) $user->id,
            'title' => 'Case created',
            'message' => "Your case {$caseNumber} has been submitted successfully.",
            'type' => 'case',
            'metadata' => ['case_id' => (string) $case->id, 'case_number' => $caseNumber],
        ]);

        $auditLogger->log('case.create.full', 'case', (string) $case->id, [
            'case_number' => $caseNumber,
            'lawyer_id' => $validated['lawyer_id'],
            'booking_id' => $validated['booking_id'],
            'judge_id' => $judge ? (string) $judge->id : null,
        ], $request, (string) $user->id);

        return response()->json([
            'message' => 'Case created successfully.',
            'data' => [
                'id' => (string) $case->id,
                'case_number' => $caseNumber,
                'status' => $case->status,
                'lawyer_id' => $case->lawyer_id,
                'judge_id' => $case->judge_id,
                'slot_time' => optional($case->slot_time)->toISOString(),
                'id_proof_url' => $idProofPath ? Storage::disk('public')->url($idProofPath) : null,
                'evidence_urls' => array_map(fn ($p) => Storage::disk('public')->url($p), $evidencePaths),
            ],
        ], 201);
    }

    private function allocateJudge(string $jurisdiction, string $caseType): ?Judge
    {
        $primary = Judge::query()
            ->where('is_available', true)
            ->where('is_primary_bench', true)
            ->orderBy('active_cases_count', 'asc')
            ->first();

        if ($primary) {
            return $primary;
        }

        return Judge::query()
            ->where('is_available', true)
            ->where('jurisdictions', $jurisdiction)
            ->where('case_types', $caseType)
            ->orderBy('active_cases_count', 'asc')
            ->first();
    }

    private function generateCaseNumber(): string
    {
        $year = now()->format('Y');
        $rand = strtoupper(Str::random(6));
        return "EC/{$year}/{$rand}";
    }

    private function asArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        return [];
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

    private function transformCase(CourtCase $case): array
    {
        $evidence = is_array($case->evidence_files) ? $case->evidence_files : [];

        return [
            'id' => (string) $case->id,
            'case_number' => $case->case_number,
            'title' => $this->partyDisplayLine($case),
            'case_type' => $case->case_type,
            'category' => $case->category,
            'jurisdiction' => $case->jurisdiction,
            'status' => strtolower((string) $case->status),
            'workflow_label' => $this->workflowLabelForCase($case->status),
            'judge_id' => $case->judge_id,
            'lawyer_id' => $case->lawyer_id,
            'judge_user_id' => $case->judge_user_id,
            'priority' => $case->priority ?? 'medium',
            'complainant' => $case->complainant ?? [],
            'accused' => $case->accused ?? [],
            'incident' => $case->incident ?? [],
            'witnesses' => $case->witnesses ?? [],
            'relief_requested' => $case->relief_requested,
            'declaration' => $case->declaration ?? [],
            'fir_summary' => data_get($case->incident, 'description')
                ?: data_get($case->incident, 'details')
                ?: data_get($case->incident, 'summary'),
            'id_proof_url' => $case->id_proof_file ? Storage::disk('public')->url($case->id_proof_file) : null,
            'evidence_urls' => array_values(array_map(fn ($path) => Storage::disk('public')->url($path), $evidence)),
            'slot_time' => optional($case->slot_time)->toISOString(),
            'next_hearing_at' => optional($case->slot_time)->toISOString(),
            'created_at' => optional($case->created_at)->toISOString(),
        ];
    }

    private function partyDisplayLine(CourtCase $case): string
    {
        $pet = data_get($case->complainant, 'name')
            ?: data_get($case->complainant, 'full_name')
            ?: 'Petitioner';
        $resp = data_get($case->accused, 'name')
            ?: data_get($case->accused, 'full_name')
            ?: 'Respondent';

        return "{$pet} vs {$resp}";
    }

    private function workflowLabelForCase(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'pending' => 'Filed',
            'filed' => 'Filed',
            'verified' => 'Verified',
            'accepted' => 'Assigned to Judge',
            'assigned_to_judge' => 'Assigned to Judge',
            'hearing_scheduled' => 'Hearing Scheduled',
            'judgment_pending' => 'Judgment Pending',
            'judgment_reserved' => 'Judgment Pending',
            'closed' => 'Closed',
            'rejected' => 'Rejected',
            default => ucfirst((string) $status ?: 'Unknown'),
        };
    }
}
