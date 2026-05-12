<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Lawyer extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'lawyers';

    protected $fillable = [
        'name',
        'role',
        'photo_url',
        'specializations',
        'experience_years',
        'cases_won',
        'rating',
        'description',
        'categories',
        'jurisdictions',
        'is_available',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'specializations' => 'array',
            'categories' => 'array',
            'jurisdictions' => 'array',
            'experience_years' => 'integer',
            'cases_won' => 'integer',
            'rating' => 'float',
            'is_available' => 'boolean',
        ];
    }
}
