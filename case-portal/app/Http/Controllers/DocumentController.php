<?php

namespace App\Http\Controllers;

use App\Models\CaseDocument;
use App\Models\CaseFile;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(string $caseId): JsonResponse
    {
        $documents = CaseDocument::where('case_file_id', $caseId)->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $documents]);
    }

    public function store(Request $request, string $caseId, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $caseFile = CaseFile::find($caseId);
        if (!$caseFile) {
            return response()->json(['message' => 'Case not found'], 404);
        }

        $file = $request->file('file');
        $path = $file->store("case-documents/{$caseId}", 'public');

        $document = CaseDocument::create([
            'case_file_id' => $caseId,
            'title' => (string) $request->input('title'),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => (string) $user->id,
        ]);

        $auditLogger->log('document.upload', 'case_document', (string) $document->id, [
            'case_id' => $caseId,
            'title' => $document->title,
        ], $request, (string) $user->id);

        return response()->json([
            'message' => 'Document uploaded.',
            'data' => [
                ...$document->toArray(),
                'download_url' => Storage::disk('public')->url($path),
            ],
        ], 201);
    }
}
