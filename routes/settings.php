<?php

use App\Http\Controllers\Settings\EditorStylesController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware('auth')->group(function () {
    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/editor-styles/preferences', [EditorStylesController::class, 'preferences'])->name('editor-styles.preferences');
    Route::get('settings/editor-styles', [EditorStylesController::class, 'edit'])->name('editor-styles.edit');
    Route::put('settings/editor-styles', [EditorStylesController::class, 'update'])->name('editor-styles.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
    Route::inertia('settings/workspaces', 'settings/workspaces')->name('settings.workspaces');
});
