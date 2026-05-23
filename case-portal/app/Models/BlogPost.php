<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\SoftDeletes;

class BlogPost extends Model
{
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'blog_posts';

    protected $fillable = [
        'author_id',
        'author_name',
        'author_role',
        'author_photo',
        'title',
        'slug',
        'excerpt',
        'body',
        'category',
        'cover_image_url',
        'tags',
        'is_featured',
        'is_published',
        'views',
        'reading_time_min',
    ];

    protected function casts(): array
    {
        return [
            'tags'         => 'array',
            'is_featured'  => 'boolean',
            'is_published' => 'boolean',
            'views'        => 'integer',
            'reading_time_min' => 'integer',
        ];
    }

    /**
     * Auto-generate slug from title if not provided.
     */
    public static function generateSlug(string $title): string
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
        $existing = static::where('slug', $slug)->count();
        return $existing ? "{$slug}-" . time() : $slug;
    }

    /**
     * Estimate reading time based on word count.
     */
    public static function estimateReadingTime(string $body): int
    {
        $wordCount = str_word_count(strip_tags($body));
        return max(1, (int) ceil($wordCount / 200));
    }
}
