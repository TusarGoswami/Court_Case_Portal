<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class PortalNotification extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'portal_notifications';

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'metadata',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'read_at' => 'datetime',
        ];
    }
}
