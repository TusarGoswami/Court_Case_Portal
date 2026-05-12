<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\HearingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\CaseCreationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\JudgeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\JudgeCaseController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('jwt.auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Create Case module APIs
    Route::get('/lawyers', [DirectoryController::class, 'lawyers']);
    Route::get('/slots', [DirectoryController::class, 'slots']);
    Route::post('/book-slot', [CaseCreationController::class, 'bookSlot']);
    Route::post('/create-case', [CaseCreationController::class, 'createCase']);
    Route::get('/my-cases', [CaseCreationController::class, 'myCases']);
    Route::get('/lawyer/case-requests', [CaseCreationController::class, 'lawyerCaseRequests'])->middleware('role:lawyer');
    Route::post('/lawyer/case-requests/{id}/respond', [CaseCreationController::class, 'respondToCaseRequest'])->middleware('role:lawyer');
    Route::get('/judges/{id}', [JudgeController::class, 'show']);
    Route::get('/judge/profile', [JudgeController::class, 'myProfile'])->middleware('role:judge');
    Route::get('/judge/assigned-cases', [JudgeCaseController::class, 'index'])->middleware('role:judge');
    Route::patch('/judge/court-cases/{id}', [JudgeCaseController::class, 'update'])->middleware('role:judge');

    // Profile
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto'])->middleware('role:lawyer,admin,judge,clerk,public_user');

    Route::get('/cases/statuses', [CaseController::class, 'statuses']);
    Route::get('/cases', [CaseController::class, 'index']);
    Route::post('/cases', [CaseController::class, 'store'])->middleware('role:admin,lawyer,clerk');
    Route::get('/cases/{id}', [CaseController::class, 'show']);
    Route::put('/cases/{id}', [CaseController::class, 'update'])->middleware('role:admin,judge,lawyer,clerk');

    Route::get('/hearings', [HearingController::class, 'index']);
    Route::post('/hearings', [HearingController::class, 'store'])->middleware('role:admin,judge,clerk');

    Route::get('/cases/{caseId}/documents', [DocumentController::class, 'index']);
    Route::post('/cases/{caseId}/documents', [DocumentController::class, 'store'])->middleware('role:admin,judge,lawyer,clerk');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::get('/messages/contacts', [MessageController::class, 'contacts']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/video/token', [VideoController::class, 'token'])->middleware('role:judge,admin,clerk');

    Route::get('/reports/dashboard', [ReportController::class, 'dashboard'])->middleware('role:admin,judge,clerk');
});