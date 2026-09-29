<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\MentionCandidateController;
use App\Http\Controllers\NodeController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('dashboard', [WorkspaceController::class, 'index'])->name('dashboard');
    Route::post('workspaces', [WorkspaceController::class, 'store'])->name('workspaces.store');
    Route::post('workspaces/{workspace}/restore', [WorkspaceController::class, 'restore'])->name('workspaces.restore');
    Route::patch('workspaces/{workspace}', [WorkspaceController::class, 'update'])->name('workspaces.update');
    Route::patch('workspaces/{workspace}/order', [WorkspaceController::class, 'reorder'])->name('workspaces.reorder');
    Route::delete('workspaces/{workspace}', [WorkspaceController::class, 'destroy'])->name('workspaces.destroy');
    Route::get('workspaces/{workspace}', [WorkspaceController::class, 'show'])->name('workspaces.show');
    Route::get('workspaces/{workspace}/mentions', [MentionCandidateController::class, 'index'])->name('mentions.candidates');
    Route::post('workspaces/{workspace}/nodes', [NodeController::class, 'store'])->name('nodes.store');
    Route::get('workspaces/{workspace}/nodes/{node}', [WorkspaceController::class, 'showNode'])->name('nodes.show');
    Route::get('workspaces/{workspace}/documents/{node}', [DocumentController::class, 'show'])->name('documents.show');
    Route::put('workspaces/{workspace}/documents/{node}', [DocumentController::class, 'update'])->name('documents.update');
    Route::patch('workspaces/{workspace}/documents/{node}/header', [DocumentController::class, 'updateHeader'])->name('documents.header');
    Route::post('workspaces/{workspace}/documents/{node}/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
    Route::get('workspaces/{workspace}/documents/{node}/attachments/{attachment}', [AttachmentController::class, 'show'])->name('attachments.show');
    Route::patch('workspaces/{workspace}/nodes/{node}', [NodeController::class, 'update'])->name('nodes.update');
    Route::patch('workspaces/{workspace}/nodes/{node}/move', [NodeController::class, 'move'])->name('nodes.move');
    Route::delete('workspaces/{workspace}/nodes/{node}', [NodeController::class, 'destroy'])->name('nodes.destroy');
    Route::post('workspaces/{workspace}/nodes/{node}/restore', [NodeController::class, 'restore'])->name('nodes.restore');
});

require __DIR__.'/settings.php';
