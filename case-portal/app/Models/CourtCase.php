<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

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
        ];
    }
}
