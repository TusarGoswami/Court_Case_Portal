<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Judge extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'judges';

    protected $fillable = [
        'name',
        'user_id',
        'login_email',
        'photo_url',
        'jurisdictions',
        'case_types',
        'is_available',
        'active_cases_count',
        'is_primary_bench',
        'position',
        'court',
        'specialization',
        'experience_label',
        'roster_status',
        'about',
        'professional_highlights',
        'key_responsibilities',
        'judicial_philosophy',
        'skills',
        'achievements',
        'availability_summary',
        'virtual_hearings_supported',
        'court_contact_email',
        'chamber',
        'office_extension',
    ];

    protected function casts(): array
    {
        return [
            'jurisdictions' => 'array',
            'case_types' => 'array',
            'specialization' => 'array',
            'professional_highlights' => 'array',
            'key_responsibilities' => 'array',
            'skills' => 'array',
            'achievements' => 'array',
            'is_available' => 'boolean',
            'is_primary_bench' => 'boolean',
            'virtual_hearings_supported' => 'boolean',
            'active_cases_count' => 'integer',
        ];
    }
}
