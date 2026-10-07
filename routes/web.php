<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\DatabaseController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\MentionCandidateController;
use App\Http\Controllers\NavigationController;
use App\Http\Controllers\NodeController;
use App\Http\Controllers\TrashController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('trash', [TrashController::class, 'index'])->name('trash.index');
    Route::get('trash/details', [TrashController::class, 'details'])->name('trash.details');
    Route::get('trash/preview', [TrashController::class, 'preview'])->name('trash.preview');
    Route::post('trash/restore', [TrashController::class, 'restore'])->name('trash.restore');
    Route::post('trash/delete', [TrashController::class, 'destroy'])->name('trash.delete');
    Route::get('workspaces/{workspace}/search', [NavigationController::class, 'search'])->name('navigation.search');
    Route::get('workspaces/{workspace}/tree', [NavigationController::class, 'tree'])->name('navigation.tree');
    Route::put('workspaces/{workspace}/nodes/{node}/tags', [NavigationController::class, 'updateTags'])->name('navigation.tags');
    Route::get('dashboard', [WorkspaceController::class, 'index'])->name('dashboard');
    Route::post('workspaces', [WorkspaceController::class, 'store'])->name('workspaces.store');
    Route::post('workspaces/{workspace}/restore', [WorkspaceController::class, 'restore'])->name('workspaces.restore');
    Route::patch('workspaces/{workspace}', [WorkspaceController::class, 'update'])->name('workspaces.update');
    Route::patch('workspaces/{workspace}/order', [WorkspaceController::class, 'reorder'])->name('workspaces.reorder');
    Route::delete('workspaces/{workspace}', [WorkspaceController::class, 'destroy'])->name('workspaces.destroy');
    Route::delete('workspaces/{workspace}/permanent', [WorkspaceController::class, 'destroyPermanently'])->name('workspaces.destroy-permanently');
    Route::get('workspaces/{workspace}', [WorkspaceController::class, 'show'])->name('workspaces.show');
    Route::put('workspaces/{workspace}/gallery', [WorkspaceController::class, 'saveGallery'])->name('workspaces.gallery.update');
    Route::put('workspaces/{workspace}/nodes/{node}/gallery', [WorkspaceController::class, 'saveGallery'])->name('nodes.gallery.update');
    Route::get('workspaces/{workspace}/mentions', [MentionCandidateController::class, 'index'])->name('mentions.candidates');
    Route::post('workspaces/{workspace}/nodes', [NodeController::class, 'store'])->name('nodes.store');
    Route::get('workspaces/{workspace}/nodes/{node}', [WorkspaceController::class, 'showNode'])->name('nodes.show');
    Route::get('workspaces/{workspace}/databases/{node}', [DatabaseController::class, 'show'])->name('databases.show');
    Route::post('workspaces/{workspace}/databases/{node}/documents', [DatabaseController::class, 'createDocument'])->name('databases.documents.store');
    Route::delete('workspaces/{workspace}/databases/{node}/documents/{document}', [DatabaseController::class, 'trashDocument'])->name('databases.documents.destroy');
    Route::post('workspaces/{workspace}/databases/{node}/properties', [DatabaseController::class, 'createProperty'])->name('databases.properties.store');
    Route::patch('workspaces/{workspace}/databases/{node}/properties/{property}', [DatabaseController::class, 'updateProperty'])->name('databases.properties.update');
    Route::patch('workspaces/{workspace}/databases/{node}/properties/{property}/order', [DatabaseController::class, 'reorderProperty'])->name('databases.properties.order');
    Route::delete('workspaces/{workspace}/databases/{node}/properties/{property}', [DatabaseController::class, 'deleteProperty'])->name('databases.properties.destroy');
    Route::put('workspaces/{workspace}/databases/{node}/documents/{document}/properties/{property}', [DatabaseController::class, 'writeValue'])->name('databases.values.update');
    Route::put('workspaces/{workspace}/databases/{node}/views/{view}', [DatabaseController::class, 'saveView'])->name('databases.views.update');
    Route::get('workspaces/{workspace}/documents/{node}', [DocumentController::class, 'show'])->name('documents.show');
    Route::put('workspaces/{workspace}/documents/{node}', [DocumentController::class, 'update'])->name('documents.update');
    Route::put('workspaces/{workspace}/documents/{node}/markdown', [DocumentController::class, 'updateMarkdown'])->name('documents.markdown.update');
    Route::get('workspaces/{workspace}/documents/{node}/mermaid-previews/{sourceHash}', [DocumentController::class, 'showMermaidPreview'])->where('sourceHash', '[a-f0-9]{64}')->name('documents.mermaid-previews.show');
    Route::post('workspaces/{workspace}/documents/{node}/mermaid-previews', [DocumentController::class, 'storeMermaidPreview'])->name('documents.mermaid-previews.store');
    Route::patch('workspaces/{workspace}/documents/{node}/header', [DocumentController::class, 'updateHeader'])->name('documents.header');
    Route::post('workspaces/{workspace}/documents/{node}/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
    Route::get('workspaces/{workspace}/documents/{node}/attachments/{attachment}', [AttachmentController::class, 'show'])->name('attachments.show');
    Route::patch('workspaces/{workspace}/nodes/{node}', [NodeController::class, 'update'])->name('nodes.update');
    Route::patch('workspaces/{workspace}/nodes/{node}/header', [NodeController::class, 'updateHeader'])->name('nodes.header');
    Route::post('workspaces/{workspace}/nodes/{node}/images', [AttachmentController::class, 'storeNodeImage'])->name('nodes.images.store');
    Route::get('workspaces/{workspace}/nodes/{node}/images/{attachment}', [AttachmentController::class, 'showNodeImage'])->name('nodes.images.show');
    Route::patch('workspaces/{workspace}/nodes/{node}/move', [NodeController::class, 'move'])->name('nodes.move');
    Route::delete('workspaces/{workspace}/nodes/{node}', [NodeController::class, 'destroy'])->name('nodes.destroy');
    Route::post('workspaces/{workspace}/nodes/{node}/restore', [NodeController::class, 'restore'])->name('nodes.restore');
});

require __DIR__.'/settings.php';
