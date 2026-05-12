<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\HasMany;

class CaseFile extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'case_files';

    protected $fillable = [
        'case_number',
        'title',
        'description',
        'status',
        'court_room',
        'filed_at',
        'next_hearing_at',
        'parties',
        'tags',
        'created_by',
        'assigned_judge_id',
        'assigned_clerk_id',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'filed_at' => 'datetime',
            'next_hearing_at' => 'datetime',
            'parties' => 'array',
            'tags' => 'array',
        ];
    }

    public function hearings(): HasMany
    {
        return $this->hasMany(Hearing::class, 'case_file_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CaseDocument::class, 'case_file_id');
    }
}
