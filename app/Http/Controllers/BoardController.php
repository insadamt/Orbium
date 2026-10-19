<?php

namespace App\Http\Controllers;

use App\Services\Boards\BoardAccess;
use App\Services\Boards\BoardContent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BoardController extends Controller
{
    public function show(Request $request, int $workspace, int $node, BoardAccess $access, BoardContent $content): Response
    {
        $workspaceModel = $request->user()->workspaces()->findOrFail($workspace);
        $board = $access->visibleBoard($request->user(), $workspace, $node);
        $breadcrumbs = [['title' => $board->title, 'href' => route('boards.show', [$workspace, $node])]];
        $ancestorId = $board->parent_id;
        $visitedIds = [$board->id => true];
        while ($ancestorId !== null) {
            abort_if(isset($visitedIds[$ancestorId]), 404);
            $visitedIds[$ancestorId] = true;
            $ancestor = $workspaceModel->nodes()->where('type', 'folder')->findOrFail($ancestorId);
            array_unshift($breadcrumbs, ['title' => $ancestor->title, 'href' => route('nodes.show', [$workspace, $ancestor])]);
            $ancestorId = $ancestor->parent_id;
        }
        array_unshift($breadcrumbs, ['title' => $workspaceModel->name, 'href' => route('workspaces.show', $workspace)]);

        return Inertia::render('boards/show', [
            'workspace' => $workspaceModel->only(['id', 'name']),
            'currentNode' => $board->only([
                'id', 'parent_id', 'type', 'title', 'position', 'is_favorite',
                'icon', 'icon_attachment_id', 'cover_attachment_id', 'cover_aspect_ratio',
            ]),
            'breadcrumbs' => $breadcrumbs,
            'boardContent' => $content->snapshot($board),
        ]);
    }
}
