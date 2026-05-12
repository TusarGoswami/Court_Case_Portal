<?php

namespace App\Support;

use App\Models\Judge;

class JudgeProfilePresenter
{
    public static function toArray(Judge $judge): array
    {
        return [
            'id' => (string) $judge->id,
            'name' => $judge->name,
            'photo_url' => $judge->photo_url,
            'position' => $judge->position,
            'court' => $judge->court,
            'specialization' => $judge->specialization ?? [],
            'experience_label' => $judge->experience_label,
            'roster_status' => $judge->roster_status,
            'about' => $judge->about,
            'professional_highlights' => $judge->professional_highlights ?? [],
            'key_responsibilities' => $judge->key_responsibilities ?? [],
            'judicial_philosophy' => $judge->judicial_philosophy,
            'skills' => $judge->skills ?? [],
            'achievements' => $judge->achievements ?? [],
            'availability_summary' => $judge->availability_summary,
            'virtual_hearings_supported' => (bool) ($judge->virtual_hearings_supported ?? false),
            'court_contact_email' => $judge->court_contact_email,
            'chamber' => $judge->chamber,
            'office_extension' => $judge->office_extension,
            'jurisdictions' => $judge->jurisdictions ?? [],
            'case_types' => $judge->case_types ?? [],
        ];
    }
}
