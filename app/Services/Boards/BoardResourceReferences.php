<?php

namespace App\Services\Boards;

use App\Models\BoardObject;
use App\Models\Node;
use App\Services\References\OwnedReferenceAvailability;
use Illuminate\Validation\ValidationException;

final class BoardResourceReferences
{
    public const TYPES = ['document', 'database', 'board'];

    public function target(Node $board, int $targetId): Node
    {
        $target = Node::query()->where('workspace_id', $board->workspace_id)->whereIn('type', self::TYPES)->findOrFail($targetId);
        abort_if($target->id === $board->id || ! app(OwnedReferenceAvailability::class)->hasVisibleAncestry($target), 404);

        return $target;
    }

    public function validate(Node $board, array $objects): void
    {
        $ids = array_values(array_unique(array_map(fn ($object) => $object['data']['target_node_id'], array_filter($objects, fn ($object) => $object['block_type'] === 'resource'))));
        if ($ids === []) {
            return;
        }
        $existing = BoardObject::query()->where('board_node_id', $board->id)->where('block_type', 'resource')->get(['object_id', 'data']);
        $previous = $existing->map(fn ($object) => $object->data['target_node_id'])->all();
        $previousByObject = $existing->keyBy('object_id');
        $nodes = Node::withTrashed()->whereIn('id', $ids)->get()->keyBy('id');
        //
        // Retain older non-Document cards without allowing new ones through insertion, duplication or clipboard writes.
        //
        foreach ($objects as $object) {
            if ($object['block_type'] !== 'resource') {
                continue;
            }
            $id = $object['data']['target_node_id'];
            $target = $nodes->get($id);
            $previousTarget = $previousByObject->get(strtolower($object['id']))?->data['target_node_id'] ?? null;
            if ($target !== null && $target->type !== 'document' && $previousTarget !== $id) {
                throw ValidationException::withMessages(['objects' => 'Only Documents can be added as inline content. Use a mention for other pages.']);
            }
        }
        foreach ($ids as $id) {
            $target = $nodes->get($id);
            if ($id === $board->id || ($target !== null && ($target->workspace_id !== $board->workspace_id || ! in_array($target->type, self::TYPES, true)))) {
                throw ValidationException::withMessages(['objects' => 'Choose a Document, Database or other Board in this workspace.']);
            }
            $available = $target !== null && app(OwnedReferenceAvailability::class)->hasVisibleAncestry($target);
            if (! $available && ! in_array($id, $previous, true)) {
                throw ValidationException::withMessages(['objects' => 'This resource is unavailable. Existing missing cards may be kept or removed.']);
            }
        }
    }
}
