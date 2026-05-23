<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlogController extends Controller
{
    /**
     * List published blog posts (paginated, filterable).
     */
    public function index(Request $request)
    {
        $query = BlogPost::where('is_published', true);

        // Filter by category
        if ($cat = $request->query('category')) {
            $query->where('category', $cat);
        }

        // Filter by tag
        if ($tag = $request->query('tag')) {
            $query->where('tags', $tag);
        }

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
        }

        // Sort
        $sort = $request->query('sort', 'latest');
        if ($sort === 'popular') {
            $query->orderBy('views', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min((int) ($request->query('per_page', 12)), 50);
        $posts = $query->paginate($perPage);

        return response()->json([
            'data'  => $posts->items(),
            'meta'  => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'total'        => $posts->total(),
                'per_page'     => $posts->perPage(),
            ],
        ]);
    }

    /**
     * Show a single blog post by slug. Increment view count.
     */
    public function show(string $slug)
    {
        $post = BlogPost::where('slug', $slug)->where('is_published', true)->first();

        if (!$post) {
            return response()->json(['message' => 'Post not found.'], 404);
        }

        $post->increment('views');

        return response()->json(['data' => $post]);
    }

    /**
     * Create a new blog post (lawyer/admin/judge only).
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'    => 'required|string|max:300',
            'excerpt'  => 'nullable|string|max:500',
            'body'     => 'required|string|min:50',
            'category' => 'nullable|string|max:100',
            'tags'     => 'nullable|array',
            'tags.*'   => 'string|max:50',
            'is_featured'  => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'cover_image'  => 'nullable|image|max:5120',
        ]);

        $user = Auth::user();

        // Handle cover image upload
        $coverUrl = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('blog_covers', 'public');
            $coverUrl = '/storage/' . $path;
        }

        $post = BlogPost::create([
            'author_id'    => (string) $user->_id,
            'author_name'  => $user->name,
            'author_role'  => $user->role,
            'author_photo' => $user->photo_url ?? '',
            'title'        => $request->title,
            'slug'         => BlogPost::generateSlug($request->title),
            'excerpt'      => $request->excerpt ?? substr(strip_tags($request->body), 0, 200) . '...',
            'body'         => $request->body,
            'category'     => $request->category ?? 'General',
            'cover_image_url' => $coverUrl,
            'tags'         => $request->tags ?? [],
            'is_featured'  => $request->boolean('is_featured', false),
            'is_published' => $request->boolean('is_published', true),
            'views'        => 0,
            'reading_time_min' => BlogPost::estimateReadingTime($request->body),
        ]);

        return response()->json(['data' => $post, 'message' => 'Blog post created successfully.'], 201);
    }

    /**
     * Update own blog post.
     */
    public function update(Request $request, string $id)
    {
        $post = BlogPost::findOrFail($id);
        $user = Auth::user();

        if ((string) $post->author_id !== (string) $user->_id) {
            return response()->json(['message' => 'You can only edit your own posts.'], 403);
        }

        $request->validate([
            'title'    => 'nullable|string|max:300',
            'excerpt'  => 'nullable|string|max:500',
            'body'     => 'nullable|string|min:50',
            'category' => 'nullable|string|max:100',
            'tags'     => 'nullable|array',
            'is_featured'  => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'cover_image'  => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('blog_covers', 'public');
            $post->cover_image_url = '/storage/' . $path;
        }

        $fillable = ['title', 'excerpt', 'body', 'category', 'tags', 'is_featured', 'is_published'];
        foreach ($fillable as $field) {
            if ($request->has($field)) {
                $post->{$field} = $request->{$field};
            }
        }

        if ($request->has('body')) {
            $post->reading_time_min = BlogPost::estimateReadingTime($request->body);
        }

        $post->save();

        return response()->json(['data' => $post, 'message' => 'Blog post updated.']);
    }

    /**
     * Delete own blog post.
     */
    public function destroy(string $id)
    {
        $post = BlogPost::findOrFail($id);
        $user = Auth::user();

        if ((string) $post->author_id !== (string) $user->_id) {
            return response()->json(['message' => 'You can only delete your own posts.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Blog post deleted.']);
    }

    /**
     * List current user's own posts.
     */
    public function myPosts()
    {
        $user = Auth::user();
        $posts = BlogPost::where('author_id', (string) $user->_id)
                         ->orderBy('created_at', 'desc')
                         ->get();

        return response()->json(['data' => $posts]);
    }
}
