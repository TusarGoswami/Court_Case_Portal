<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\CourtCase;
use App\Models\Hearing;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'total_cases' => CourtCase::count(),
            'open_cases' => CourtCase::whereNotIn('status', ['closed'])->count(),
            'closed_cases' => CourtCase::where('status', 'closed')->count(),
            'scheduled_hearings' => Hearing::where('status', 'scheduled')->count(),
            'audit_events' => AuditLog::count(),
        ];

        $statusBreakdown = CourtCase::raw(function ($collection) {
            return $collection->aggregate([
                ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]],
            ]);
        })->toArray();

        return response()->json([
            'stats' => $stats,
            'status_breakdown' => $statusBreakdown,
        ]);
    }
}
