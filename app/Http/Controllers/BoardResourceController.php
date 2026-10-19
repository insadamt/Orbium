<?php

namespace App\Http\Controllers;

use App\Actions\Boards\CreateBoardDocument;
use App\Services\Boards\BoardAccess;
use App\Services\Boards\BoardResourceReferences;
use App\Services\Boards\BoardResources;
use App\Services\Boards\BoardSaveData;
use App\Services\Boards\BoardSaveRules;
use App\Services\Boards\CreateBoardDocumentData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BoardResourceController extends Controller
{
    public function index(Request $request, int $workspace, int $node, BoardAccess $access, BoardResources $resources): JsonResponse
    {
        $board = $access->visibleBoard($request->user(), $workspace, $node);
        $data = $request->validate(['q' => ['sometimes', 'nullable', 'string', 'max:120'], 'after' => ['sometimes', 'integer', 'min:0', 'max:9007199254740991']]);

        return $this->json($resources->browse($board, trim($data['q'] ?? ''), (int) ($data['after'] ?? 0)));
    }

    public function previews(Request $request, int $workspace, int $node, BoardAccess $access, BoardResources $resources): JsonResponse
    {
        $board = $access->visibleBoard($request->user(), $workspace, $node);
        $data = $request->validate(['ids' => ['required', 'array', 'list', 'min:1', 'max:40'], 'ids.*' => ['required', 'integer', 'min:1', 'max:9007199254740991', 'distinct']]);

        return $this->json(['resources' => $resources->previews($board, $data['ids'])]);
    }

    public function document(Request $request, int $workspace, int $node, int $target, BoardAccess $access, BoardResourceReferences $references, BoardResources $resources): JsonResponse
    {
        $board = $access->visibleBoard($request->user(), $workspace, $node);

        return $this->json($resources->document($references->target($board, $target)));
    }

    public function createDocument(Request $request, int $workspace, int $node, BoardAccess $access, CreateBoardDocument $action): JsonResponse
    {
        $board = $access->visibleBoard($request->user(), $workspace, $node);
        $data = $request->validate([
            ...BoardSaveRules::rules(),
            'request_id' => ['required', 'uuid'], 'title' => ['required', 'string', 'max:255'],
            'object' => ['required', 'array:id,x,y,width,height'], 'object.id' => ['required', 'uuid'],
            'object.x' => ['required', 'numeric', 'between:-10000000,10000000'], 'object.y' => ['required', 'numeric', 'between:-10000000,10000000'],
            'object.width' => ['required', 'numeric', 'between:80,4000'], 'object.height' => ['required', 'numeric', 'between:32,4000'],
        ]);

        return $this->json($action->create($board, new CreateBoardDocumentData(strtolower($data['request_id']), $data['title'], new BoardSaveData((int) $data['revision'], $data['objects']), $data['object'])));
    }

    private function json(array $data): JsonResponse
    {
        return response()->json($data)->header('Cache-Control', 'private, no-store');
    }
}
