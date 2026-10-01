<?php

namespace App\Http\Controllers;

use App\Actions\Workspaces\ManageWorkspaces;
use App\Models\Node;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): RedirectResponse|Response
    {
        $workspace = $request->user()->workspaces()->orderBy('position')->first();

        return $workspace
            ? to_route('workspaces.show', $workspace)
            : Inertia::render('dashboard');
    }

    public function show(Request $request, int $workspace): Response
    {
        return $this->renderWorkspace($request, $workspace, null);
    }

    public function showNode(Request $request, int $workspace, int $node): RedirectResponse|Response
    {
        $workspaceModel = $this->ownedWorkspace($request, $workspace);
        $nodeModel = $workspaceModel->nodes()->findOrFail($node);
        if ($nodeModel->type === 'document') {
            return to_route('documents.show', [$workspace, $node]);
        }
        if ($nodeModel->type === 'database') {
            return to_route('databases.show', [$workspace, $node, ...$request->only(['view', 'focus'])]);
        }

        return $this->renderWorkspace($request, $workspace, $node);
    }

    public function store(Request $request, ManageWorkspaces $workspaces): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'return_to_settings' => ['sometimes', 'boolean'],
        ]);
        $workspace = $workspaces->create($request->user(), $data['name']);

        return ($data['return_to_settings'] ?? false)
            ? to_route('settings.workspaces')
            : to_route('workspaces.show', $workspace);
    }

    public function update(Request $request, int $workspace): RedirectResponse
    {
        $workspace = $this->ownedWorkspace($request, $workspace);
        $data = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $workspace->update($data);

        return back();
    }

    public function reorder(Request $request, int $workspace, ManageWorkspaces $workspaces): RedirectResponse
    {
        $workspace = $this->ownedWorkspace($request, $workspace);
        $data = $request->validate(['position' => ['required', 'integer', 'min:0']]);
        $workspaces->reorder($workspace, $data['position']);

        return back();
    }

    public function destroy(Request $request, int $workspace, ManageWorkspaces $workspaces): RedirectResponse
    {
        $workspaces->trash($this->ownedWorkspace($request, $workspace));

        return to_route('settings.workspaces');
    }

    public function destroyPermanently(Request $request, int $workspace, ManageWorkspaces $workspaces): RedirectResponse
    {
        $workspaceModel = Workspace::query()->withTrashed()
            ->where('user_id', $request->user()->id)->findOrFail($workspace);
        $data = $request->validate(['confirmed_name' => ['required', 'string', 'max:255']]);
        if (! hash_equals($workspaceModel->name, $data['confirmed_name'])) {
            throw ValidationException::withMessages([
                'confirmed_name' => 'Type the workspace name exactly to confirm deletion.',
            ]);
        }
        $workspaces->deletePermanently($workspaceModel);

        return to_route('settings.workspaces');
    }

    public function restore(Request $request, int $workspace, ManageWorkspaces $workspaces): RedirectResponse
    {
        $workspace = Workspace::query()->onlyTrashed()->where('user_id', $request->user()->id)->findOrFail($workspace);
        $workspaces->restore($workspace);

        return to_route('settings.workspaces');
    }

    private function renderWorkspace(Request $request, int $workspaceId, ?int $nodeId): Response
    {
        $workspace = $this->ownedWorkspace($request, $workspaceId);
        $nodes = $workspace->nodes()->with('document')->orderBy('position')->orderBy('id')->get();
        $visibleNodes = $nodes->filter(function (Node $node) use ($nodes): bool {
            $ancestorId = $node->parent_id;
            while ($ancestorId !== null) {
                $ancestor = $nodes->firstWhere('id', $ancestorId);
                if ($ancestor === null) {
                    return false;
                }
                $ancestorId = $ancestor->parent_id;
            }

            return true;
        })->values();
        $currentNode = $nodeId === null ? null : $visibleNodes->firstWhere('id', $nodeId);
        if ($nodeId !== null && $currentNode === null) {
            abort(404);
        }

        $breadcrumbs = [['title' => $workspace->name, 'href' => route('workspaces.show', $workspace)]];
        $ancestor = $currentNode;
        $nodeCrumbs = [];
        while ($ancestor !== null) {
            array_unshift($nodeCrumbs, ['title' => $ancestor->title, 'href' => route('nodes.show', [$workspace, $ancestor])]);
            $ancestor = $visibleNodes->firstWhere('id', $ancestor->parent_id);
        }

        return Inertia::render('dashboard', [
            'workspace' => $workspace->only(['id', 'name', 'position']),
            'nodes' => $visibleNodes->map(fn (Node $node) => $this->explorerNode($node))->values(),
            'trashedNodes' => Node::query()->onlyTrashed()->where('workspace_id', $workspace->id)->orderByDesc('deleted_at')->get(['id', 'parent_id', 'type', 'title', 'deleted_at']),
            'currentNode' => $currentNode ? $this->explorerNode($currentNode) : null,
            'breadcrumbs' => [...$breadcrumbs, ...$nodeCrumbs],
        ]);
    }

    private function ownedWorkspace(Request $request, int $workspaceId): Workspace
    {
        return $request->user()->workspaces()->findOrFail($workspaceId);
    }

    private function explorerNode(Node $node): array
    {
        return [
            ...$node->only(['id', 'parent_id', 'type', 'title', 'position', 'icon']),
            'cover_attachment_id' => $node->type === 'document'
                ? $node->document?->cover_attachment_id : $node->cover_attachment_id,
            'icon_attachment_id' => $node->type === 'document'
                ? $node->document?->icon_attachment_id : $node->icon_attachment_id,
        ];
    }
}
