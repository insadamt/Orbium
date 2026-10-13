<?php

namespace App\Services\References;

use App\Models\Attachment;
use App\Models\Node;
use App\Models\Workspace;
use Illuminate\Support\Facades\Storage;

final class OwnedReferenceAvailability
{
    public function findNode(Workspace $workspace, int $id): ?Node
    {
        $node = $workspace->nodes()->whereKey($id)->first();

        return $node !== null && $this->hasVisibleAncestry($node) ? $node : null;
    }

    public function hasVisibleAncestry(Node $node): bool
    {
        $seen = [];
        while (true) {
            if ($node->trashed() || isset($seen[$node->id]) || count($seen) >= 1000) {
                return false;
            }
            $seen[$node->id] = true;
            if ($node->parent_id === null) {
                return true;
            }
            $parent = Node::query()->where('workspace_id', $node->workspace_id)->whereKey($node->parent_id)->first();
            if ($parent === null || ! in_array($parent->type, ['folder', 'database'], true) || ($parent->type === 'database' && $node->type !== 'document')) {
                return false;
            }
            $node = $parent;
        }
    }

    public function findAttachment(Workspace $workspace, int $ownerId, int $id): ?Attachment
    {
        $owner = $this->findNode($workspace, $ownerId);
        if ($owner === null || $owner->type !== 'document') {
            return null;
        }
        $file = Attachment::query()->where('workspace_id', $workspace->id)->where('owner_node_id', $ownerId)->whereKey($id)->first();

        return $file !== null && Storage::disk('local')->exists($file->storage_key) ? $file : null;
    }
}
