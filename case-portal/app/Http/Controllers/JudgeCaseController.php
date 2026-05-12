<?php

namespace App\Http\Controllers;

use App\Models\CourtCase;
use App\Models\Hearing;
use App\Models\PortalNotification;
use App\Models\Judge;
use App\Models\Lawyer;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JudgeCaseController extends Controller
{
    /** Court case statuses visible on the judge roster after lawyer acceptance. */
    private const VISIBLE_STATUSES = [
        'accepted',
        'verified',
        'assigned_to_judge',
        'hearing_scheduled',
        'judgment_pending',
        'judgment_reserved',
        'closed',
    ];

    public function index(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $judge = $this->resolveJudgeForUser($user);
        if (!$judge) {
            return response()->json([
                'message' => 'No judge roster profile is linked to this account. Add user_id to your judge record or match judge name to your user profile.',
                'data' => [],
            ], 200);
        }

        $nameCache = [];
        $cases = CourtCase::query()
            ->where('judge_id', (string) $judge->id)
            ->whereIn('status', self::VISIBLE_STATUSES)
            ->orderBy('created_at', 'desc')
            ->limit(300)
            ->get()
            ->map(fn (CourtCase $case) => $this->presentCourtCase($case, $nameCache));

        return response()->json(['data' => $cases]);
    }

    public function update(Request $request, string $id, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $judge = $this->resolveJudgeForUser($user);
        if (!$judge) {
            return response()->json(['message' => 'Judge profile not linked'], 403);
        }

        $case = CourtCase::find($id);
        if (!$case || (string) $case->judge_id !== (string) $judge->id) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                'verified',
                'accepted',
                'assigned_to_judge',
                'hearing_scheduled',
                'judgment_pending',
                'judgment_reserved',
                'closed',
            ])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'scheduled_at' => [Rule::requiredIf(fn () => $request->input('status') === 'hearing_scheduled'), 'nullable', 'date'],
            'title' => ['nullable', 'string', 'max:150'],
            'agenda' => ['nullable', 'string', 'max:2000'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:480'],
            'location' => ['nullable', 'string', 'max:120'],
            'meeting_link' => ['nullable', 'url', 'max:240'],
        ]);

        $case->update(array_filter([
            'status' => $validated['status'],
            'priority' => $validated['priority'] ?? null,
            'slot_time' => $validated['status'] === 'hearing_scheduled' ? Carbon::parse($validated['scheduled_at']) : null,
        ], fn ($v) => $v !== null));

        $hearing = null;
        if ($validated['status'] === 'hearing_scheduled') {
            $scheduledAt = Carbon::parse($validated['scheduled_at']);
            $hearing = Hearing::query()
                ->where('case_file_id', (string) $case->id)
                ->orderBy('scheduled_at', 'desc')
                ->first();

            $hearingData = [
                'case_file_id' => (string) $case->id,
                'title' => trim((string) ($validated['title'] ?? '')) ?: "Hearing scheduled for case {$case->case_number}",
                'agenda' => $validated['agenda'] ?? null,
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => $validated['duration_minutes'] ?? 30,
                'location' => $validated['location'] ?? null,
                'meeting_link' => $validated['meeting_link'] ?? null,
                'status' => 'scheduled',
                'created_by' => (string) $user->id,
            ];

            if ($hearing) {
                $hearing->update($hearingData);
            } else {
                $hearing = Hearing::create($hearingData);
            }

            $formatted = $scheduledAt->format('d M Y, h:i A');

            PortalNotification::create([
                'user_id' => (string) $case->lawyer_id,
                'title' => 'Hearing scheduled',
                'message' => "Hearing for case {$case->case_number} has been scheduled for {$formatted}.",
                'type' => 'hearing',
                'metadata' => [
                    'case_id' => (string) $case->id,
                    'hearing_id' => (string) $hearing->id,
                    'scheduled_at' => $scheduledAt->toISOString(),
                    'recipient_role' => 'lawyer',
                ],
            ]);

            $clerkUser = null;
            $clerkId = trim((string) ($case->assigned_clerk_id ?? ''));
            if ($clerkId !== '') {
                $clerkUser = User::find($clerkId);
            }

            if (!$clerkUser) {
                $clerkUser = User::query()->where('role', 'clerk')->orderBy('created_at')->first();
            }

            if ($clerkUser) {
                PortalNotification::create([
                    'user_id' => (string) $clerkUser->id,
                    'title' => 'Hearing scheduled',
                    'message' => "Hearing for case {$case->case_number} has been scheduled for {$formatted}.",
                    'type' => 'hearing',
                    'metadata' => [
                        'case_id' => (string) $case->id,
                        'hearing_id' => (string) $hearing->id,
                        'scheduled_at' => $scheduledAt->toISOString(),
                        'recipient_role' => 'clerk',
                    ],
                ]);
            }
        }

        $auditLogger->log('court_case.judge_update', 'case', (string) $case->id, array_filter([
            'status' => $validated['status'],
            'priority' => $validated['priority'] ?? null,
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'title' => $validated['title'] ?? null,
            'agenda' => $validated['agenda'] ?? null,
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'location' => $validated['location'] ?? null,
            'meeting_link' => $validated['meeting_link'] ?? null,
        ], fn ($value) => $value !== null), $request, (string) $user->id);

        $nameCache = [];

        return response()->json([
            'message' => 'Case updated successfully.',
            'data' => $this->presentCourtCase($case->fresh(), $nameCache),
        ]);
    }

    private function resolveJudgeForUser(?User $user): ?Judge
    {
        if (!$user || ($user->role ?? '') !== 'judge') {
            return null;
        }

        $linked = Judge::query()->where('user_id', (string) $user->id)->first();
        if ($linked) {
            return $linked;
        }

        $byLogin = Judge::query()->where('login_email', strtolower((string) $user->email))->first();
        if ($byLogin) {
            return $byLogin;
        }

        $norm = static function (?string $s): string {
            $t = strtolower(trim((string) $s));

            return (string) preg_replace('/\s+/', ' ', $t);
        };

        $userName = $norm($user->name ?? '');

        foreach (Judge::query()->cursor() as $candidate) {
            if ($norm($candidate->name ?? '') === $userName && $userName !== '') {
                return $candidate;
            }
        }

        return null;
    }

    private function partyLine(CourtCase $case): string
    {
        $pet = data_get($case->complainant, 'name')
            ?: data_get($case->complainant, 'full_name')
            ?: 'Petitioner';
        $resp = data_get($case->accused, 'name')
            ?: data_get($case->accused, 'full_name')
            ?: 'Respondent';

        return "{$pet} vs {$resp}";
    }

    private function workflowLabel(?string $status): string
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

    /** Featured roster slug keys used alongside Mongo IDs when assigning counsel. */
    private static function demoSlugToLawyerName(string $slug): ?string
    {
        return match (strtolower(trim($slug))) {
            'jagdishwar' => 'Jagdishwar Mishra',
            'jagdish' => 'Jagdish Tyagi',
            'rahman' => 'Rahman Dakaait',
            'tushar' => 'Tushar',
            default => null,
        };
    }

    /**
     * @param  array<string, string>  $cache
     */
    private function resolveLawyerDisplayName(?string $lawyerId, array &$cache): string
    {
        $lawyerId = $lawyerId !== null ? trim((string) $lawyerId) : '';

        if ($lawyerId === '') {
            return '—';
        }

        if (isset($cache[$lawyerId])) {
            return $cache[$lawyerId];
        }

        $user = User::find($lawyerId);
        if ($user) {
            return $cache[$lawyerId] = (string) ($user->name ?? 'Counsel');
        }

        $lawyer = Lawyer::find($lawyerId);
        if ($lawyer) {
            return $cache[$lawyerId] = (string) ($lawyer->name ?? 'Counsel');
        }

        $fromSlug = self::demoSlugToLawyerName($lawyerId);
        if ($fromSlug !== null) {
            return $cache[$lawyerId] = $fromSlug;
        }

        return $cache[$lawyerId] = 'Counsel (ref)';
    }

    /**
     * @param  array<string, string>  $lawyerNameCache
     */
    private function presentCourtCase(CourtCase $case, array &$lawyerNameCache): array
    {
        $evidence = is_array($case->evidence_files) ? $case->evidence_files : [];

        return [
            'id' => (string) $case->id,
            'case_number' => $case->case_number,
            'title' => $this->partyLine($case),
            'case_type' => $case->case_type,
            'category' => $case->category,
            'jurisdiction' => $case->jurisdiction,
            'status' => strtolower((string) $case->status),
            'workflow_label' => $this->workflowLabel($case->status),
            'judge_id' => $case->judge_id,
            'lawyer_id' => $case->lawyer_id,
            'lawyer_name' => $this->resolveLawyerDisplayName($case->lawyer_id, $lawyerNameCache),
            'complainant' => $case->complainant ?? [],
            'accused' => $case->accused ?? [],
            'incident' => $case->incident ?? [],
            'witnesses' => $case->witnesses ?? [],
            'relief_requested' => $case->relief_requested,
            'fir_summary' => data_get($case->incident, 'description')
                ?: data_get($case->incident, 'details')
                ?: data_get($case->incident, 'summary'),
            'declaration' => $case->declaration ?? [],
            'id_proof_url' => $case->id_proof_file ? \Illuminate\Support\Facades\Storage::disk('public')->url($case->id_proof_file) : null,
            'evidence_urls' => array_values(array_map(
                fn ($path) => \Illuminate\Support\Facades\Storage::disk('public')->url($path),
                $evidence
            )),
            'slot_time' => optional($case->slot_time)->toISOString(),
            'next_hearing_at' => optional($case->slot_time)->toISOString(),
            'priority' => $case->priority ?? 'medium',
            'created_at' => optional($case->created_at)->toISOString(),
        ];
    }
}
