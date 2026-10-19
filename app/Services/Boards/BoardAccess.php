<?php

namespace App\Services\Boards;

use App\Models\Node;
use App\Models\User;

final class BoardAccess
{
    public function visibleBoard(User $user, int $workspaceId, int $nodeId): Node
    {
        $workspace = $user->workspaces()->findOrFail($workspaceId);
        $board = $workspace->nodes()->where('type', 'board')->findOrFail($nodeId);
        $ancestorId = $board->parent_id;
        $visited = [$board->id => true];
        while ($ancestorId !== null) {
            abort_if(isset($visited[$ancestorId]), 404);
            $visited[$ancestorId] = true;
            $ancestorId = $workspace->nodes()->where('type', 'folder')->findOrFail($ancestorId)->parent_id;
        }

        return $board;
    }
}
