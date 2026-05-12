<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class CaseDocument extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'case_documents';

    protected $fillable = [
        'case_file_id',
        'title',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];
}
