<?php

namespace App\Http\Controllers;

use App\Actions\Boards\ApplyBoardMutation;
use App\Actions\Boards\SaveBoard;
use App\Services\Boards\BoardAccess;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardMutationData;
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

    public function mutate(Request $request, int $workspace, int $node, BoardAccess $access, ApplyBoardMutation $action): JsonResponse
    {
        $board = $access->visibleBoard($request->user(), $workspace, $node);
        $data = $request->validate([
            'format_version' => ['required', 'integer', 'in:'.BoardContent::FORMAT_VERSION],
            'mutation_version' => ['required', 'integer', 'in:1'],
            'revision' => ['required', 'integer', 'min:0', 'max:9007199254740990'],
            'mutation_id' => ['required', 'uuid'],
            ...BoardSaveRules::objects('creates'),
            ...BoardSaveRules::objects('updates'),
            'deletes' => ['present', 'array', 'list'],
            'deletes.*' => ['required', 'uuid', 'distinct:ignore_case'],
        ]);
        $mutation = new BoardMutationData((int) $data['revision'], strtolower($data['mutation_id']), $data['creates'], $data['updates'], $data['deletes']);

        return response()->json(['mutation_id' => $mutation->mutationId, 'revision' => $action->apply($board, $mutation)])->header('Cache-Control', 'private, no-store');
    }
}
