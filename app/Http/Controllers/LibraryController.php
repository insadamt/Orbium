<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Services\Library\LibraryCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class LibraryController extends Controller
{
    public function index(Request $request, int $workspace): Response
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);

        return Inertia::render('library/index', ['workspace' => $workspace->only(['id', 'name']),
            'breadcrumbs' => [['title' => $workspace->name, 'href' => '/workspaces/'.$workspace->id], ['title' => 'Library', 'href' => '/workspaces/'.$workspace->id.'/library']]]);
    }

    public function files(Request $request, int $workspace, LibraryCatalog $catalog): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);

        return response()->json(['files' => $catalog->files($workspace)])->header('Cache-Control', 'no-store');
    }

    public function rename(Request $request, int $workspace, int $attachment): JsonResponse
    {
        $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', 'regex:/^[\pL\pN ._()-]+$/u']]);
        $name = trim($data['name']);
        if ($name === '') {
            throw ValidationException::withMessages(['name' => 'Enter a filename.']);
        }
        Attachment::query()->where('workspace_id', $workspace)->findOrFail($attachment)->update(['original_name' => $name]);

        return response()->json(['name' => $name]);
    }

    public function destroy(Request $request, int $workspace, LibraryCatalog $catalog): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['ids' => ['required', 'array', 'min:1', 'max:100'], 'ids.*' => ['required', 'integer', 'distinct'], 'confirmed' => ['accepted']]);
        $files = Attachment::query()->where('workspace_id', $workspace->id)->whereIn('id', $data['ids'])->get();
        abort_unless($files->count() === count($data['ids']), 404);
        $usage = $catalog->usage($workspace);
        foreach ($files as $file) {
            if (! empty($usage[$file->id])) {
                throw ValidationException::withMessages(['ids' => 'No files were deleted. A selected file is still used, including by content in Trash. Refresh the Library and review its usage.']);
            }
        }
        foreach ($files as $file) {
            $file->forceDelete();
        }
        DB::afterCommit(function () use ($files): void {
            foreach ($files as $file) {
                try {
                    if (! Storage::disk('local')->delete($file->storage_key)) {
                        Log::warning('Library binary cleanup failed.', ['attachment_id' => $file->id]);
                    }
                } catch (\Throwable $failure) {
                    report($failure);
                }
            }
        });

        return response()->json(['deleted' => $files->pluck('id')]);
    }
}
