<?php

namespace App\Http\Controllers;

use App\Services\Search\SearchQuery;
use App\Services\Search\WorkspaceSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NavigationController extends Controller
{
    public function search(Request $request, int $workspace, WorkspaceSearch $search): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $input = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer'],
            'recent' => ['sometimes', 'array', 'max:40'],
            'recent.*' => ['integer', 'min:1'],
        ]);

        return response()->json($search->search($workspace, SearchQuery::parse($input)));
    }

    public function tree(Request $request, int $workspace): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $nodes = $workspace->nodes()->orderBy('position')->orderBy('id')->get(['id', 'parent_id', 'title', 'type', 'position']);
        $byId = $nodes->keyBy('id');
        $visible = $nodes->filter(function ($node) use ($byId) {
            $visited = [];
            while ($node->parent_id !== null) {
                if (isset($visited[$node->id]) || ! isset($byId[$node->parent_id])) {
                    return false;
                }
                $visited[$node->id] = true;
                $node = $byId[$node->parent_id];
            }

            return true;
        })->values();

        $tags = DB::table('node_tag')->join('tags', 'tags.id', '=', 'node_tag.tag_id')
            ->where('tags.workspace_id', $workspace->id)
            ->whereIn('node_tag.node_id', $visible->pluck('id'))
            ->orderBy('tags.name')->get(['node_tag.node_id', 'tags.name'])->groupBy('node_id');

        return response()->json($visible->map(function ($node) use ($tags) {
            $node->tags = $tags->get($node->id, collect())->pluck('name')->all();

            return $node;
        }));
    }

    public function updateTags(Request $request, int $workspace, int $node): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $node = $workspace->nodes()->findOrFail($node);
        $ancestor = $node;
        while ($ancestor->parent_id !== null) {
            $ancestor = $workspace->nodes()->findOrFail($ancestor->parent_id);
        }
        $data = $request->validate(['tags' => ['present', 'array', 'max:20'], 'tags.*' => ['required', 'string', 'max:80', 'regex:/^[\pL\pN_-]+$/u']]);
        DB::transaction(function () use ($workspace, $node, $data) {
            DB::table('nodes')->where('id', $node->id)->lockForUpdate()->first();
            DB::table('node_tag')->where('node_id', $node->id)->delete();
            foreach (array_unique(array_map('mb_strtolower', $data['tags'])) as $name) {
                DB::table('tags')->insertOrIgnore(['workspace_id' => $workspace->id, 'name' => $name]);
                $tagId = DB::table('tags')->where('workspace_id', $workspace->id)->where('name', $name)->value('id');
                DB::table('node_tag')->insert(['node_id' => $node->id, 'tag_id' => $tagId]);
            }
        });

        return response()->json(['saved' => true]);
    }
}
