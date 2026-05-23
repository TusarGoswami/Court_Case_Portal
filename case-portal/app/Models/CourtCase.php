<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\HasMany;

class CourtCase extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'cases';

    protected $fillable = [
        'case_number',
        'status',
        'case_type',
        'category',
        'jurisdiction',
        'incident',
        'complainant',
        'accused',
        'witnesses',
        'relief_requested',
        'declaration',
        'evidence_files',
        'id_proof_file',
        'lawyer_id',
        'judge_id',
        'judge_user_id',
        'priority',
        'booking_id',
        'slot_time',
        'created_by',
        
        // Fields unified from CaseFile
        'title',
        'description',
        'court_room',
        'filed_at',
        'next_hearing_at',
        'parties',
        'tags',
        'assigned_judge_id',
        'assigned_clerk_id',
    ];

    protected function casts(): array
    {
        return [
            'incident' => 'array',
            'complainant' => 'array',
            'accused' => 'array',
            'witnesses' => 'array',
            'declaration' => 'array',
            'evidence_files' => 'array',
            'slot_time' => 'datetime',
            
            // Casts unified from CaseFile
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
