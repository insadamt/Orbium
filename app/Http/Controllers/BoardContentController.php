<?php

namespace App\Http\Controllers;

use App\Actions\Boards\SaveBoard;
use App\Services\Boards\BoardAccess;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardSaveData;
use App\Services\Boards\BoardSaveRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BoardContentController extends Controller
{
    public function show(Request $request, int $workspace, int $node, BoardAccess $access, BoardContent $content): JsonResponse
    {
        return response()->json($content->snapshot($access->visibleBoard($request->user(), $workspace, $node)))->header('Cache-Control', 'private, no-store');
    }

    public function update(Request $request, int $workspace, int $node, BoardAccess $access, SaveBoard $action): JsonResponse
    {
        $board = $access->visibleBoard($request->user(), $workspace, $node);
        $data = $request->validate(BoardSaveRules::rules());

        return response()->json(['revision' => $action->save($board, new BoardSaveData((int) $data['revision'], $data['objects']))])->header('Cache-Control', 'private, no-store');
    }
}
