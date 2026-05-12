<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Hearing extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'hearings';

    protected $fillable = [
        'case_file_id',
        'title',
        'agenda',
        'scheduled_at',
        'duration_minutes',
        'location',
        'meeting_link',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }
}
