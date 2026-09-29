<?php

namespace App\Http\Controllers;

use App\Actions\Workspaces\ManageWorkspaces;
use App\Models\Node;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): RedirectResponse|Response
    {
        $workspace = $request->user()->workspaces()->orderBy('position')->first();

        return $workspace
            ? to_route('workspaces.show', $workspace)
            : Inertia::render('dashboard', ['workspaces' => [], 'trashedWorkspaces' => $this->trashedWorkspaces($request)]);
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

        return $this->renderWorkspace($request, $workspace, $node);
    }

    public function store(Request $request, ManageWorkspaces $workspaces): RedirectResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $workspace = $workspaces->create($request->user(), $data['name']);

        return to_route('workspaces.show', $workspace);
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

        return to_route('dashboard');
    }

    public function restore(Request $request, int $workspace, ManageWorkspaces $workspaces): RedirectResponse
    {
        $workspace = Workspace::query()->onlyTrashed()->where('user_id', $request->user()->id)->findOrFail($workspace);
        $workspaces->restore($workspace);

        return to_route('workspaces.show', $workspace);
    }

    private function renderWorkspace(Request $request, int $workspaceId, ?int $nodeId): Response
    {
        $workspace = $this->ownedWorkspace($request, $workspaceId);
        $nodes = $workspace->nodes()->orderBy('position')->orderBy('id')->get();
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
            'workspaces' => $request->user()->workspaces()->orderBy('position')->get(['id', 'name', 'position']),
            'trashedWorkspaces' => $this->trashedWorkspaces($request),
            'workspace' => $workspace->only(['id', 'name', 'position']),
            'nodes' => $visibleNodes->map(fn (Node $node) => $node->only(['id', 'parent_id', 'type', 'title', 'position']))->values(),
            'trashedNodes' => Node::query()->onlyTrashed()->where('workspace_id', $workspace->id)->orderByDesc('deleted_at')->get(['id', 'parent_id', 'type', 'title', 'deleted_at']),
            'currentNode' => $currentNode?->only(['id', 'parent_id', 'type', 'title', 'position']),
            'breadcrumbs' => [...$breadcrumbs, ...$nodeCrumbs],
        ]);
    }

    private function ownedWorkspace(Request $request, int $workspaceId): Workspace
    {
        return $request->user()->workspaces()->findOrFail($workspaceId);
    }

    /** @return Collection<int, Workspace> */
    private function trashedWorkspaces(Request $request): Collection
    {
        return Workspace::query()->onlyTrashed()->where('user_id', $request->user()->id)->orderByDesc('deleted_at')->get(['id', 'name', 'deleted_at']);
    }
}
