<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class AuditLog extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'audit_logs';

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'payload',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
