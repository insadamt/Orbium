<?php

namespace App\Actions\Boards;

use App\Models\Board;
use App\Models\Node;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardObjectRows;
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
            app(BoardObjectRows::class)->write($node->id, $objects);
            $board->forceFill(['revision' => $board->revision + 1, 'last_mutation_id' => null, 'last_mutation_hash' => null])->save();

            return $board->revision;
        });
    }
}
