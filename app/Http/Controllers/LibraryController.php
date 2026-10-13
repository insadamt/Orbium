<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Services\Library\LibraryBrowseData;
use App\Services\Library\LibraryCatalog;
use App\Services\Library\LibraryImagePreview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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

        return response()->json($catalog->files($workspace, LibraryBrowseData::fromRequest($request)))->header('Cache-Control', 'no-store');
    }

    public function show(Request $request, int $workspace, int $attachment, LibraryCatalog $catalog): Response
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $file = Attachment::query()->where('workspace_id', $workspace->id)->findOrFail($attachment);
        $browse = LibraryBrowseData::fromRequest($request);

        return Inertia::render('library/show', ['workspace' => $workspace->only(['id', 'name']),
            'file' => $catalog->details($workspace, $file), 'neighbors' => $catalog->neighbors($workspace, $file, $browse),
            'filters' => $browse->filters(), 'breadcrumbs' => [
                ['title' => $workspace->name, 'href' => '/workspaces/'.$workspace->id],
                ['title' => 'Library', 'href' => '/workspaces/'.$workspace->id.'/library'],
                ['title' => $file->original_name, 'href' => '/workspaces/'.$workspace->id.'/library/items/'.$file->id],
            ]]);
    }

    public function selection(Request $request, int $workspace, LibraryCatalog $catalog): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['ids' => ['required', 'array', 'min:1', 'max:100'], 'ids.*' => ['required', 'integer', 'distinct']]);
        $files = Attachment::query()->where('workspace_id', $workspace->id)->whereIn('id', $data['ids'])->get();
        abort_unless($files->count() === count($data['ids']), 404);
        $usage = $catalog->usage($workspace);

        return response()->json(['files' => $files->map(fn ($file) => [...$catalog->summary($file), 'usage' => array_values($usage[$file->id] ?? [])])]);
    }

    public function thumbnail(Request $request, int $workspace, int $attachment, LibraryImagePreview $preview): BinaryFileResponse|RedirectResponse
    {
        $request->user()->workspaces()->findOrFail($workspace);
        $file = Attachment::query()->where('workspace_id', $workspace)->findOrFail($attachment);
        abort_unless(in_array($file->mime_type, LibraryImagePreview::IMAGE_TYPES, true) && Storage::disk('local')->exists($file->storage_key), 404);
        try {
            $path = $preview->createThumbnail($file);
        } catch (\Throwable $failure) {
            report($failure);
            $path = null;
        }

        return $path === null ? redirect()->route('library.files.show', [$workspace, $attachment])
            : response()->file($path, ['Content-Type' => 'image/png', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-cache', 'Content-Security-Policy' => "default-src 'none'"])->setPrivate();
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
                    if (! Storage::disk('local')->delete([$file->storage_key, app(LibraryImagePreview::class)->cacheKey($file)])) {
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
