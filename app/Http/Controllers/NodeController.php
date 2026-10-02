<?php

namespace App\Http\Controllers;

use App\Actions\Nodes\ManageHierarchy;
use App\Models\Attachment;
use App\Models\Node;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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

    public function updateHeader(Request $request, int $workspace, int $node): JsonResponse
    {
        $container = $this->visibleNode($request, $workspace, $node);
        abort_unless(in_array($container->type, ['folder', 'database'], true), 404);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:16'],
            'cover_attachment_id' => ['sometimes', 'nullable', 'integer'],
            'cover_aspect_ratio' => ['sometimes', 'nullable', Rule::in(['16:9', '9:16', '3:2', '4:3', '1:1', '4:5'])],
            'icon_attachment_id' => ['sometimes', 'nullable', 'integer'],
        ]);
        if (isset($data['cover_attachment_id']) && $data['cover_attachment_id'] !== $container->cover_attachment_id && empty($data['cover_aspect_ratio'])) {
            throw ValidationException::withMessages(['cover_aspect_ratio' => 'Choose a cover aspect ratio.']);
        }
        if (array_key_exists('cover_aspect_ratio', $data) && ! array_key_exists('cover_attachment_id', $data)) {
            throw ValidationException::withMessages(['cover_attachment_id' => 'Select a cover with its aspect ratio.']);
        }
        foreach (['cover_attachment_id', 'icon_attachment_id'] as $field) {
            if (! isset($data[$field])) {
                continue;
            }
            $validImage = Attachment::query()->where('workspace_id', $container->workspace_id)
                ->where('owner_node_id', $container->id)->where('purpose', 'image')
                ->whereKey($data[$field])->exists();
            abort_unless($validImage, 422);
        }
        if (array_key_exists('cover_attachment_id', $data) && $data['cover_attachment_id'] === null) {
            $data['cover_aspect_ratio'] = null;
        }
        $container->update($data);

        return response()->json($container->only(['title', 'icon', 'cover_attachment_id', 'cover_aspect_ratio', 'icon_attachment_id']));
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
