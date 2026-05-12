<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use MongoDB\Laravel\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'is_active',
        'photo_url',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'email_verified_at' => 'datetime',
        ];
    }
}