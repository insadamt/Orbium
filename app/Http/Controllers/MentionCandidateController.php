<?php

namespace App\Http\Controllers;

use App\Models\Node;
use App\Services\References\OwnedReferenceAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MentionCandidateController extends Controller
{
    public function index(Request $request, int $workspace): JsonResponse
    {
        $workspaceModel = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['q' => ['sometimes', 'nullable', 'string', 'max:120'], 'source_id' => ['required', 'integer', 'min:1', 'max:9007199254740991']]);
        abort_if(app(OwnedReferenceAvailability::class)->findNode($workspaceModel, (int) $data['source_id']) === null, 404);
        $query = trim($data['q'] ?? '');
        $nodes = $workspaceModel->nodes()->with('parent:id,title')->whereKeyNot((int) $data['source_id'])->when($query !== '', fn ($builder) => $builder->where('title', 'ilike', '%'.addcslashes($query, '%_\\').'%'))
            ->orderBy('title')->limit(50)->get(['id', 'parent_id', 'title', 'type']);
        $visible = $nodes->filter(fn (Node $node): bool => app(OwnedReferenceAvailability::class)->hasVisibleAncestry($node));

        return response()->json($visible->map(fn (Node $node): array => [
            ...$node->only(['id', 'title', 'type']),
            'parent_title' => $node->parent?->title,
            'url' => route('nodes.show', [$workspace, $node->id], false),
        ])->values())->header('Cache-Control', 'private, no-store');
    }
}
