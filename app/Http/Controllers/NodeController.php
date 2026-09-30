<?php

namespace App\Http\Controllers;

use App\Actions\Nodes\ManageHierarchy;
use App\Models\Node;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NodeController extends Controller
{
    public function store(Request $request, int $workspace, ManageHierarchy $hierarchy): RedirectResponse
    {
        $workspace = $this->ownedWorkspace($request, $workspace);
        $data = $request->validate([
            'type' => ['required', 'in:folder,document,database'],
            'title' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer'],
        ]);
        $node = $hierarchy->create($workspace, $data['type'], $data['title'], $data['parent_id'] ?? null);

        return to_route('nodes.show', [$workspace, $node]);
    }

    public function update(Request $request, int $workspace, int $node): RedirectResponse
    {
        $node = $this->visibleNode($request, $workspace, $node);
        $data = $request->validate(['title' => ['required', 'string', 'max:255']]);
        $node->update($data);

        return back();
    }

    public function move(Request $request, int $workspace, int $node, ManageHierarchy $hierarchy): RedirectResponse
    {
        $node = $this->visibleNode($request, $workspace, $node);
        $data = $request->validate([
            'parent_id' => ['nullable', 'integer'],
            'position' => ['required', 'integer', 'min:0'],
        ]);
        $hierarchy->move($node, $data['parent_id'] ?? null, $data['position']);

        return back();
    }

    public function destroy(Request $request, int $workspace, int $node, ManageHierarchy $hierarchy): RedirectResponse
    {
        $node = $this->visibleNode($request, $workspace, $node);
        $hierarchy->trash($node);

        return to_route('workspaces.show', $workspace);
    }

    public function restore(Request $request, int $workspace, int $node, ManageHierarchy $hierarchy): RedirectResponse
    {
        $workspace = $this->ownedWorkspace($request, $workspace);
        $node = Node::query()->onlyTrashed()->where('workspace_id', $workspace->id)->findOrFail($node);
        $hierarchy->restore($node);

        return back();
    }

    private function ownedWorkspace(Request $request, int $workspaceId): Workspace
    {
        return $request->user()->workspaces()->findOrFail($workspaceId);
    }

    private function visibleNode(Request $request, int $workspaceId, int $nodeId): Node
    {
        $workspace = $this->ownedWorkspace($request, $workspaceId);
        $node = $workspace->nodes()->findOrFail($nodeId);
        $ancestorId = $node->parent_id;
        while ($ancestorId !== null) {
            $ancestor = $workspace->nodes()->findOrFail($ancestorId);
            $ancestorId = $ancestor->parent_id;
        }

        return $node;
    }
}
