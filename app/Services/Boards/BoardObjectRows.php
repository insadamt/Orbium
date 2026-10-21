<?php

namespace App\Services\Boards;

use App\Models\Board;
use Illuminate\Support\Facades\DB;

final class BoardObjectRows
{
    /** @param list<array<string, mixed>> $objects */
    public function write(int $boardId, array $objects): void
    {
        if ($objects === []) {
            return;
        }
        $timestamp = now();
        $rows = array_map(function (array $object) use ($boardId, $timestamp): array {
            $data = json_encode((object) $object['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

            return [
                'board_node_id' => $boardId,
                'object_id' => $object['id'],
                ...array_diff_key($object, ['id' => true, 'data' => true]),
                'data' => $data,
                'data_bytes' => strlen($data),
                'markdown' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }, $objects);
        DB::table('board_objects')->upsert($rows, ['board_node_id', 'object_id'], [
            'block_type', 'content_format_version', 'data', 'data_bytes', 'markdown', 'x', 'y', 'width', 'height', 'layer', 'updated_at',
        ]);
    }

    public function initializeMissingBudgets(Board $board): void
    {
        $missing = $board->objects()->whereNull('data_bytes')->get();
        if ($missing->isEmpty()) {
            return;
        }
        $rows = $missing->map(function ($object): array {
            $data = json_encode((object) $object->data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

            return [...$object->getAttributes(), 'data_bytes' => strlen($data)];
        })->all();
        //
        // One bounded bootstrap upsert avoids one UPDATE per existing block; only derived budget metadata changes.
        //
        DB::table('board_objects')->upsert($rows, ['board_node_id', 'object_id'], ['data_bytes']);
    }
}
