<?php

namespace App\Actions\Boards;

use App\Models\Board;
use App\Models\Node;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardSaveData;
use Illuminate\Support\Facades\DB;

final class SaveBoard
{
    public function save(Node $node, BoardSaveData $data): int
    {
        return DB::transaction(function () use ($node, $data): int {
            $node->board()->firstOrCreate([]);
            $board = Board::query()->whereKey($node->id)->lockForUpdate()->firstOrFail();
            abort_unless($board->format_version === BoardContent::FORMAT_VERSION, 422, 'This Board format needs a newer Orbium version.');
            abort_unless($board->revision === $data->revision, 409, 'This Board changed elsewhere. Your local draft is kept; load the latest version before editing further.');
            $objects = app(BoardContent::class)->validateObjects($node, $data->objects);
            $objectIds = array_column($objects, 'id');
            $board->objects()->whereNotIn('object_id', $objectIds)->delete();
            $timestamp = now();
            $rows = array_map(fn (array $object): array => [
                'board_node_id' => $node->id,
                'object_id' => $object['id'],
                ...array_diff_key($object, ['id' => true, 'data' => true]),
                'data' => json_encode((object) $object['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                'markdown' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ], $objects);
            if ($rows !== []) {
                DB::table('board_objects')->upsert($rows, ['board_node_id', 'object_id'], [
                    'block_type', 'content_format_version', 'data', 'markdown', 'x', 'y', 'width', 'height', 'layer', 'updated_at',
                ]);
            }
            $board->update(['revision' => $board->revision + 1]);

            return $board->revision;
        });
    }
}
