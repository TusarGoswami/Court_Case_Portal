<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Lawyer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DirectoryController extends Controller
{
    public function lawyers(Request $request): JsonResponse
    {
        $seed = [
            [
                'name' => 'Jagdishwar Mishra',
                'photo_url' => 'images/Jagdishwar_Mishra.png',
                'role' => 'Senior Advocate',
                'specializations' => ['Criminal Law', 'Constitutional Law'],
                'experience_years' => 15,
                'cases_won' => 0,
                'rating' => 4.9,
                'description' => 'Highly respected, sharp legal intellect.',
                'categories' => ['Criminal', 'Civil'],
                'jurisdictions' => ['Delhi', 'Mumbai'],
                'is_available' => true,
                'priority' => 1,
            ],
            [
                'name' => 'Jagdish Tyagi',
                'photo_url' => 'images/Jagdish_Tyagi.png',
                'role' => 'Advocate',
                'specializations' => ['Civil Law', 'Consumer Cases'],
                'experience_years' => 10,
                'cases_won' => 0,
                'rating' => 4.7,
                'description' => 'Client-focused lawyer.',
                'categories' => ['Civil'],
                'jurisdictions' => ['Delhi', 'Mumbai'],
                'is_available' => true,
                'priority' => 2,
            ],
            [
                'name' => 'Rahman Dakaait',
                'photo_url' => 'images/Rahman_Dakaait.png',
                'role' => 'Criminal Law Expert',
                'specializations' => ['Criminal Defense', 'Fraud Cases'],
                'experience_years' => 12,
                'cases_won' => 0,
                'rating' => 4.8,
                'description' => 'Fearless defense lawyer.',
                'categories' => ['Criminal'],
                'jurisdictions' => ['Delhi', 'Mumbai'],
                'is_available' => true,
                'priority' => 3,
            ],
            [
                'name' => 'Tushar',
                'photo_url' => 'images/Tushar.png',
                'role' => 'Junior Advocate',
                'specializations' => ['Legal Research', 'Drafting'],
                'experience_years' => 3,
                'cases_won' => 0,
                'rating' => 4.5,
                'description' => 'Young legal professional.',
                'categories' => ['Civil', 'Criminal'],
                'jurisdictions' => ['Delhi', 'Mumbai'],
                'is_available' => true,
                'priority' => 4,
            ],
        ];

        foreach ($seed as $l) {
            Lawyer::updateOrCreate(
                ['name' => $l['name']],
                $l
            );
        }

        $lawyers = Lawyer::where('is_available', true)
            ->orderBy('priority', 'asc')
            ->limit(4)
            ->get();

        // IMPORTANT: convert image path to full URL
        $lawyers->transform(function ($lawyer) {
            $lawyer->photo_url = asset($lawyer->photo_url);
            return $lawyer;
        });

        return response()->json(['data' => $lawyers]);
    }

    public function slots(Request $request): JsonResponse
    {
        $lawyerId = $request->query('lawyer_id');
        $days = min(max((int)$request->query('days', 7), 1), 14);

        if (!$lawyerId) {
            return response()->json(['message' => 'lawyer_id required'], 422);
        }

        $start = Carbon::today();
        $end = Carbon::today()->addDays($days);

        $booked = Booking::where('lawyer_id', $lawyerId)
            ->whereIn('status', ['reserved', 'confirmed'])
            ->pluck('slot_time')
            ->toArray();

        $slots = [];
        $times = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::today()->addDays($i);

            foreach ($times as $time) {
                $slot = Carbon::parse($date->format('Y-m-d') . ' ' . $time);

                $slots[] = [
                    'slot_time' => $slot->toISOString(),
                    'date' => $date->format('Y-m-d'),
                    'time' => $time,
                    'is_booked' => in_array($slot->toISOString(), $booked),
                ];
            }
        }

        return response()->json(['data' => $slots]);
    }
}