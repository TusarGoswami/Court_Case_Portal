<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Booking extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'bookings';

    protected $fillable = [
        'lawyer_id',
        'user_id',
        'date',
        'time',
        'slot_time',
        'status',
        'case_id',
    ];

    protected function casts(): array
    {
        return [
            'slot_time' => 'datetime',
        ];
    }
}
