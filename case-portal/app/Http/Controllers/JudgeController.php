<?php

namespace App\Http\Controllers;

use App\Models\Judge;
use App\Support\JudgeProfilePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JudgeController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $judge = Judge::find($id);

        if (!$judge) {
            return response()->json(['message' => 'Judge not found'], 404);
        }

        return response()->json(['data' => JudgeProfilePresenter::toArray($judge)]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $bench = Judge::query()->where('user_id', (string) $user->id)->first()
            ?? Judge::query()->where('login_email', strtolower((string) $user->email))->first();

        if (!$bench) {
            return response()->json(['message' => 'Judge roster entry not linked'], 404);
        }

        return response()->json(['data' => JudgeProfilePresenter::toArray($bench)]);
    }
}
