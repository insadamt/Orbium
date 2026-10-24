<?php

namespace App\Actions\Boards;

use App\Actions\Nodes\ManageHierarchy;
use App\Models\Board;
use App\Models\Node;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardResources;
use App\Services\Boards\BoardSaveData;
use App\Services\Boards\CreateBoardDocumentData;
use Illuminate\Support\Facades\DB;

final class CreateBoardDocument
{
    public function create(Node $node, CreateBoardDocumentData $data): array
    {
        return DB::transaction(function () use ($node, $data): array {
            $board = Board::query()->whereKey($node->id)->lockForUpdate()->firstOrFail();
            abort_unless($board->format_version === BoardContent::FORMAT_VERSION, 422, 'This Board needs a newer version.');
            $hash = hash('sha256', json_encode([$data->title, $data->snapshot->revision, $data->snapshot->objects, $data->object], JSON_THROW_ON_ERROR));
            $receipt = DB::table('board_document_creations')->where('board_node_id', $node->id)->where('request_id', $data->requestId)->first();
            if ($receipt !== null) {
                abort_unless(hash_equals($receipt->request_hash, $hash), 409, 'This creation request was already used with different data.');
                abort_if($receipt->document_node_id === null, 410, 'The previously created Document was permanently removed.');
                abort_unless($board->revision === (int) $receipt->result_revision, 409, 'The Document was created, but the Board changed afterward. Load the latest Board; retrying will not create another Document.');

                return $this->result($node, (int) $receipt->document_node_id);
            }
            abort_unless($board->revision === $data->snapshot->revision, 409, 'The Board changed elsewhere. Load the latest version before creating a Document.');
            abort_if(in_array(strtolower($data->object['id']), array_map(fn ($object) => strtolower($object['id']), $data->snapshot->objects), true), 422, 'Use a new object identity.');
            $document = app(ManageHierarchy::class)->create($node->workspace, 'document', $data->title, $node->parent_id);
            $object = [...$data->object, 'block_type' => 'resource', 'content_format_version' => 1, 'data' => ['target_node_id' => $document->id], 'layer' => count($data->snapshot->objects)];
            $revision = app(SaveBoard::class)->save($node, new BoardSaveData($data->snapshot->revision, [...$data->snapshot->objects, $object]));
            DB::table('board_document_creations')->insert(['board_node_id' => $node->id, 'request_id' => $data->requestId, 'request_hash' => $hash, 'document_node_id' => $document->id, 'result_revision' => $revision, 'created_at' => now(), 'updated_at' => now()]);

            return $this->result($node, $document->id);
        });
    }

    private function result(Node $board, int $documentId): array
    {
        $resource = app(BoardResources::class)->previews($board, [$documentId])[0] ?? null;
        abort_if($resource === null, 410, 'The previously created Document is unavailable. Check Trash before creating another.');

        return ['snapshot' => app(BoardContent::class)->snapshot($board), 'resource' => $resource];
    }
}
