<?php

namespace App\Http\Controllers;

use App\Actions\Trash\ManageTrash;
use App\Actions\Trash\TrashCatalog;
use App\Actions\Trash\TrashSelection;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TrashController extends Controller
{
    public function index(Request $request): Response
    {
        $catalog = new TrashCatalog($request->user());
        $workspaceId = $request->integer('workspace') ?: null;
        abort_if($workspaceId !== null && ! $catalog->workspaces->has($workspaceId), 404);

        return Inertia::render('trash/index', [
            'trashEntries' => $catalog->roots(),
            'trashWorkspaces' => $catalog->workspaces->values()->map(fn ($workspace) => [
                'id' => $workspace->id, 'name' => $workspace->name, 'trashed' => $workspace->trashed(),
            ]),
            'initialWorkspaceId' => $workspaceId,
            'breadcrumbs' => [
                ['title' => 'Trash', 'href' => '/trash'],
                ...($workspaceId === null ? [] : [['title' => $catalog->workspaces[$workspaceId]->name, 'href' => '/trash?workspace='.$workspaceId]]),
            ],
            'cleanupWarning' => $request->session()->get('trash_cleanup_warning'),
        ]);
    }

    public function details(Request $request): JsonResponse
    {
        $data = $request->validate(['key' => ['required', 'regex:/^(node|workspace):[1-9][0-9]*$/']]);
        $catalog = new TrashCatalog($request->user());
        $entry = $catalog->entry($data['key']);
        $nodes = $catalog->containedNodes($data['key']);
        $rootNodeId = str_starts_with($data['key'], 'node:') ? (int) substr($data['key'], 5) : null;
        $document = $entry['type'] === 'document' ? Document::find($rootNodeId) : null;

        return response()->json([
            'entry' => $entry,
            'excerpt' => $document ? Str::limit($document->plain_text, 4000) : null,
            'children' => $nodes->filter(fn ($node) => $node->id !== $rootNodeId)->values()->map(fn ($node) => [
                'key' => 'node:'.$node->id,
                'parent_key' => $node->parent_id === null ? 'workspace:'.$node->workspace_id : 'node:'.$node->parent_id,
                'title' => $node->title,
                'type' => $node->type,
                'explicitly_trashed' => $node->trashed(),
                'path' => $catalog->parentPath($node),
            ]),
        ]);
    }

    public function preview(Request $request, ManageTrash $trash): JsonResponse
    {
        return response()->json($trash->preview(new TrashCatalog($request->user()), $this->selection($request)));
    }

    public function restore(Request $request, ManageTrash $trash): RedirectResponse
    {
        $request->validate(['restore_ancestors' => ['required', 'boolean']]);
        $selection = $this->selection($request);
        abort_if($selection->emptyScope, 422);
        $trash->restore($request->user(), $selection, $request->boolean('restore_ancestors'));

        return back();
    }

    public function destroy(Request $request, ManageTrash $trash): RedirectResponse
    {
        $data = $request->validate([
            'fingerprint' => ['required', 'string', 'size:64'],
            'confirmed_names' => ['present', 'array'],
            'confirmed_names.*' => ['string', 'max:255'],
        ]);
        $cleaned = $trash->deletePermanently($request->user(), $this->selection($request), $data['fingerprint'], $data['confirmed_names']);

        return back()->with('trash_cleanup_warning', $cleaned ? null : 'Items were deleted. Some stored files could not be removed; ask your administrator to check the server log.');
    }

    private function selection(Request $request): TrashSelection
    {
        $data = $request->validate([
            'keys' => ['sometimes', 'array', 'max:1000'],
            'keys.*' => ['required', 'string', 'distinct', 'regex:/^(node|workspace):[1-9][0-9]*$/'],
            'empty_scope' => ['required', 'boolean'],
            'workspace_id' => ['nullable', 'integer', 'min:1'],
        ]);
        abort_if(! $data['empty_scope'] && count($data['keys'] ?? []) === 0, 422);

        return new TrashSelection($data['keys'] ?? [], $data['empty_scope'], $data['workspace_id'] ?? null);
    }
}
