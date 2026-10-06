<?php

namespace App\Actions\Trash;

use App\Models\Attachment;
use App\Models\Node;
use App\Models\User;
use Illuminate\Support\Collection;

class TrashCatalog
{
    public Collection $workspaces;

    public Collection $nodes;

    public Collection $attachments;

    public function __construct(User $user)
    {
        $this->workspaces = $user->workspaces()->withTrashed()->orderBy('id')->get()->keyBy('id');
        $this->nodes = Node::withTrashed()->whereIn('workspace_id', $this->workspaces->keys())
            ->orderBy('id')->get(['id', 'workspace_id', 'parent_id', 'type', 'title', 'deleted_at', 'updated_at'])->keyBy('id');
        $this->attachments = Attachment::withTrashed()->whereIn('workspace_id', $this->workspaces->keys())
            ->get(['id', 'workspace_id', 'owner_node_id', 'storage_key', 'size_bytes', 'updated_at']);
    }

    public function roots(): array
    {
        $entries = [];
        foreach ($this->workspaces as $workspace) {
            if ($workspace->trashed()) {
                $entries[] = $this->entry('workspace:'.$workspace->id);
            }
        }
        foreach ($this->nodes as $node) {
            if (! $node->trashed() || $this->workspaces[$node->workspace_id]->trashed()) {
                continue;
            }
            $ancestor = $this->nodes->get($node->parent_id);
            while ($ancestor !== null && ! $ancestor->trashed()) {
                $ancestor = $this->nodes->get($ancestor->parent_id);
            }
            if ($ancestor === null) {
                $entries[] = $this->entry('node:'.$node->id);
            }
        }

        return $entries;
    }

    public function entry(string $key): array
    {
        [$kind, $id] = explode(':', $key);
        $model = $kind === 'workspace' ? $this->workspaces->get((int) $id) : $this->nodes->get((int) $id);
        abort_unless($model !== null && $model->trashed(), 404);
        $workspace = $kind === 'workspace' ? $model : $this->workspaces[$model->workspace_id];
        $nodes = $this->containedNodes($key);
        $attachments = $this->containedAttachments($key, $nodes);

        return [
            'key' => $key,
            'title' => $kind === 'workspace' ? $model->name : $model->title,
            'type' => $kind === 'workspace' ? 'workspace' : $model->type,
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'deleted_at' => $model->deleted_at->toISOString(),
            'path' => $kind === 'workspace' ? 'Account' : $this->parentPath($model),
            'descendant_count' => $nodes->count() - ($kind === 'node' ? 1 : 0),
            'attachment_count' => $attachments->count(),
            'size_bytes' => $attachments->sum('size_bytes'),
            'restore_ancestors' => $kind === 'node' ? $this->deletedAncestors($model) : [],
        ];
    }

    public function containedNodes(string $key): Collection
    {
        [$kind, $id] = explode(':', $key);
        if ($kind === 'workspace') {
            return $this->nodes->where('workspace_id', (int) $id);
        }
        $ids = [(int) $id];
        $children = $this->nodes->groupBy('parent_id');
        for ($index = 0; $index < count($ids); $index++) {
            foreach ($children->get($ids[$index], collect()) as $child) {
                $ids[] = $child->id;
            }
        }

        return $this->nodes->only($ids)->keyBy('id');
    }

    public function containedAttachments(string $key, Collection $nodes): Collection
    {
        if (str_starts_with($key, 'workspace:')) {
            return $this->attachments->where('workspace_id', (int) substr($key, 10));
        }

        return $this->attachments->whereIn('owner_node_id', $nodes->pluck('id')->all());
    }

    public function parentPath(Node $node): string
    {
        $segments = [];
        $ancestor = $this->nodes->get($node->parent_id);
        while ($ancestor !== null) {
            array_unshift($segments, $ancestor->title);
            $ancestor = $this->nodes->get($ancestor->parent_id);
        }
        array_unshift($segments, $this->workspaces[$node->workspace_id]->name);

        return implode(' / ', $segments);
    }

    public function deletedAncestors(Node $node): array
    {
        $keys = [];
        $ancestor = $this->nodes->get($node->parent_id);
        while ($ancestor !== null) {
            if ($ancestor->trashed()) {
                array_unshift($keys, 'node:'.$ancestor->id);
            }
            $ancestor = $this->nodes->get($ancestor->parent_id);
        }
        if ($this->workspaces[$node->workspace_id]->trashed()) {
            array_unshift($keys, 'workspace:'.$node->workspace_id);
        }

        return $keys;
    }
}
