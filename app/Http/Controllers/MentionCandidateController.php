<?php

namespace App\Http\Controllers;

use App\Models\Node;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MentionCandidateController extends Controller
{
    public function index(Request $request, int $workspace): JsonResponse
    {
        $workspaceModel = $request->user()->workspaces()->findOrFail($workspace);
        $query = trim((string) $request->query('q', ''));
        $nodes = $workspaceModel->nodes()->when($query !== '', fn ($builder) => $builder->where('title', 'ilike', '%'.addcslashes($query, '%_\\').'%'))
            ->orderBy('title')->limit(50)->get(['id', 'parent_id', 'title', 'type']);
        $visible = $nodes->filter(function (Node $node) use ($workspaceModel): bool {
            $ancestor = $node;
            while ($ancestor->parent_id !== null) {
                $ancestor = $workspaceModel->nodes()->find($ancestor->parent_id);
                if ($ancestor === null) {
                    return false;
                }
            }

            return true;
        });

        return response()->json($visible->values());
    }
}
