<?php

namespace App\Actions\Nodes;

use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManageBulkNodes
{
    public function __construct(private ManageHierarchy $hierarchy) {}

    public function applyBulkAction(Workspace $workspace, array $data): void
    {
        DB::transaction(function () use ($workspace, $data): void {
            $workspace->newQuery()->whereKey($workspace->id)->lockForUpdate()->firstOrFail();
            $nodes = $workspace->nodes()->whereIn('id', $data['node_ids'])
                ->orderBy('position')->orderBy('id')->get();
            if ($nodes->count() !== count($data['node_ids']) || $nodes->pluck('parent_id')->unique()->count() !== 1) {
                throw ValidationException::withMessages(['node_ids' => 'Select visible items from the same folder.']);
            }
            $ancestorId = $nodes->first()->parent_id;
            while ($ancestorId !== null) {
                $ancestorId = $workspace->nodes()->findOrFail($ancestorId)->parent_id;
            }
            $parentId = $data['parent_id'] ?? null;
            $remainingSiblingCount = $workspace->nodes()->where('parent_id', $parentId)
                ->whereNotIn('id', $data['node_ids'])->count();
            $position = min($data['position'] ?? $remainingSiblingCount, $remainingSiblingCount);
            foreach ($nodes as $node) {
                if ($data['action'] === 'move') {
                    $this->hierarchy->move($node, $parentId, $workspace->nodes()->where('parent_id', $parentId)->count());
                } else {
                    $this->hierarchy->trash($node);
                }
            }
            if ($data['action'] === 'move' && isset($data['position'])) {
                // Append first so insertion cannot reverse items that originally preceded the drop target.
                foreach ($nodes->reverse() as $node) {
                    $this->hierarchy->move($node, $parentId, $position);
                }
            }
        });
    }
}
