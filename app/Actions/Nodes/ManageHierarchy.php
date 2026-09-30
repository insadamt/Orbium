<?php

namespace App\Actions\Nodes;

use App\Actions\Databases\ManageDatabase;
use App\Models\DatabaseValue;
use App\Models\Node;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManageHierarchy
{
    public function create(Workspace $workspace, string $type, string $title, ?int $parentId): Node
    {
        return DB::transaction(function () use ($workspace, $type, $title, $parentId): Node {
            $this->lockWorkspace($workspace);
            $parent = $this->findParent($workspace, $parentId);
            $this->assertValidParent($workspace, $parent, $type);

            $node = $workspace->nodes()->create([
                'parent_id' => $parent?->id,
                'type' => $type,
                'title' => $title,
                'position' => $this->siblings($workspace, $parentId)->count(),
            ]);

            if ($type === 'document') {
                $node->document()->create([
                    'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph']]],
                    'content_format_version' => 1,
                    'plain_text' => '',
                ]);
            }
            if ($type === 'database') {
                $node->database()->create();
            }
            if ($type === 'document' && $parent?->type === 'database') {
                app(ManageDatabase::class)->initializeDocument($parent, $node);
            }

            return $node;
        });
    }

    public function move(Node $node, ?int $parentId, int $position): void
    {
        DB::transaction(function () use ($node, $parentId, $position): void {
            $workspace = $node->workspace;
            $this->lockWorkspace($workspace);
            $node->refresh();
            $parent = $this->findParent($workspace, $parentId);
            $this->assertValidParent($workspace, $parent, $node->type, $node);

            $previousParentId = $node->parent_id;
            $destination = $this->siblings($workspace, $parentId)
                ->whereKeyNot($node->id)->get()->all();
            array_splice($destination, min($position, count($destination)), 0, [$node]);

            $node->parent()->associate($parent);
            $node->save();
            if ($node->type === 'document' && $previousParentId !== $parentId) {
                DatabaseValue::query()->where('document_node_id', $node->id)->delete();
                if ($parent?->type === 'database') {
                    app(ManageDatabase::class)->initializeDocument($parent, $node);
                }
            }
            $this->writeSiblingPositions($destination);

            if ($previousParentId !== $parentId) {
                $this->writeSiblingPositions($this->siblings($workspace, $previousParentId)->get()->all());
            }
        });
    }

    public function trash(Node $node): void
    {
        DB::transaction(function () use ($node): void {
            $workspace = $node->workspace;
            $this->lockWorkspace($workspace);
            $parentId = $node->parent_id;
            $node->delete();
            $this->writeSiblingPositions($this->siblings($workspace, $parentId)->get()->all());
        });
    }

    public function restore(Node $node): void
    {
        DB::transaction(function () use ($node): void {
            $workspace = $node->workspace;
            $this->lockWorkspace($workspace);
            $parent = $this->findParent($workspace, $node->parent_id);
            $this->assertValidParent($workspace, $parent, $node->type, $node);
            $node->position = $this->siblings($workspace, $node->parent_id)->count();
            $node->restore();
            $node->save();
        });
    }

    private function lockWorkspace(Workspace $workspace): void
    {
        Workspace::query()->whereKey($workspace->id)->lockForUpdate()->firstOrFail();
    }

    private function findParent(Workspace $workspace, ?int $parentId): ?Node
    {
        return $parentId === null ? null : Node::query()->withTrashed()
            ->where('workspace_id', $workspace->id)->findOrFail($parentId);
    }

    private function assertValidParent(Workspace $workspace, ?Node $parent, string $childType, ?Node $movingNode = null): void
    {
        if ($parent === null) {
            return;
        }

        if ($parent->trashed() || $parent->workspace_id !== $workspace->id || $parent->type === 'document'
            || ($parent->type === 'database' && $childType !== 'document')) {
            throw ValidationException::withMessages(['parent_id' => 'This parent cannot contain that node.']);
        }

        $ancestor = $parent;
        while ($ancestor !== null) {
            if ($movingNode !== null && $ancestor->id === $movingNode->id) {
                throw ValidationException::withMessages(['parent_id' => 'A node cannot move into itself or its descendants.']);
            }

            $ancestor = $ancestor->parent_id === null ? null : Node::query()->withTrashed()
                ->where('workspace_id', $workspace->id)->find($ancestor->parent_id);
            if ($ancestor !== null && $ancestor->trashed()) {
                throw ValidationException::withMessages(['parent_id' => 'The destination is in Trash.']);
            }
        }
    }

    /** @return Builder<Node> */
    private function siblings(Workspace $workspace, ?int $parentId): Builder
    {
        return Node::query()->where('workspace_id', $workspace->id)
            ->where('parent_id', $parentId)->orderBy('position')->orderBy('id');
    }

    /** @param array<int, Node> $nodes */
    private function writeSiblingPositions(array $nodes): void
    {
        foreach ($nodes as $position => $node) {
            if ($node->position !== $position) {
                $node->position = max(0, $position);
                $node->save();
            }
        }
    }
}
