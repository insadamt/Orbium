<?php

namespace App\Actions\Boards;

use App\Models\Board;
use App\Models\Node;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardMutationData;
use App\Services\Boards\BoardObjectRows;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ApplyBoardMutation
{
    public function apply(Node $node, BoardMutationData $data): int
    {
        return DB::transaction(function () use ($node, $data): int {
            $board = Board::query()->whereKey($node->id)->lockForUpdate()->first();
            if ($board === null) {
                $node->board()->firstOrCreate([]);
                $board = Board::query()->whereKey($node->id)->lockForUpdate()->firstOrFail();
            }
            abort_unless($board->format_version === BoardContent::FORMAT_VERSION, 422, 'This Board format needs a newer Orbium version.');
            if ($board->last_mutation_id === $data->mutationId) {
                abort_unless(hash_equals((string) $board->last_mutation_hash, $data->hash()), 409, 'This mutation identity was already used with different data.');
                abort_unless($board->revision === $data->revision + 1, 409, 'The mutation was saved, but the Board changed afterward. Your local draft is kept; load the latest Board.');

                return $board->revision;
            }
            abort_unless($board->revision === $data->revision, 409, 'This Board changed elsewhere. Your local draft is kept; load the latest Board.');
            $rows = app(BoardObjectRows::class);
            $existing = $board->objects()->get(['object_id', 'data_bytes', 'layer', 'content_format_version'])->keyBy('object_id');
            abort_if($existing->contains(fn ($object) => $object->content_format_version !== 1), 422, 'Save the full legacy Board before using incremental changes.');
            $createIds = array_map(fn ($object) => strtolower($object['id']), $data->creates);
            $updateIds = array_map(fn ($object) => strtolower($object['id']), $data->updates);
            $deleteIds = array_map('strtolower', $data->deletes);
            $allIds = [...$createIds, ...$updateIds, ...$deleteIds];
            if (count($allIds) !== count(array_unique($allIds)) || $allIds === []) {
                $this->invalid('Use one nonempty mutation with each object identity in exactly one operation.');
            }
            foreach ($createIds as $id) {
                if ($existing->has($id)) {
                    $this->invalid('Created objects must have new identities in this Board.');
                }
            }
            foreach ([...$updateIds, ...$deleteIds] as $id) {
                if (! $existing->has($id)) {
                    $this->invalid('Updated and deleted objects must already belong to this Board.');
                }
            }
            $count = $existing->count() + count($createIds) - count($deleteIds);
            if ($count > BoardContent::MAX_OBJECTS) {
                $this->invalid('Use at most 1,000 Board objects.');
            }
            $objects = app(BoardContent::class)->validateObjects($node, [...$data->creates, ...$data->updates]);
            $layers = $existing->mapWithKeys(fn ($object) => [$object->object_id => $object->layer])->all();
            foreach ($deleteIds as $id) {
                unset($layers[$id]);
            }
            foreach ($objects as $object) {
                $layers[$object['id']] = $object['layer'];
            }
            $orderedLayers = array_values($layers);
            sort($orderedLayers);
            if ($orderedLayers !== ($count ? range(0, $count - 1) : [])) {
                $this->invalid('Keep a unique, contiguous layer order across the resulting Board.');
            }
            if ($existing->contains(fn ($object) => $object->data_bytes === null)) {
                $rows->initializeMissingBudgets($board);
                $existing = $board->objects()->get(['object_id', 'data_bytes'])->keyBy('object_id');
            }
            $bytes = (int) $existing->sum('data_bytes');
            foreach ([...$updateIds, ...$deleteIds] as $id) {
                $bytes -= (int) $existing->get($id)->data_bytes;
            }
            foreach ($objects as $object) {
                $bytes += strlen(json_encode((object) $object['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
            }
            if ($bytes > 4194304) {
                $this->invalid('Use at most 4 MiB of data per Board.');
            }
            if ($deleteIds !== []) {
                $board->objects()->whereIn('object_id', $deleteIds)->delete();
            }
            $rows->write($node->id, $objects);
            //
            // Keep one bounded replay receipt. Older requests fail the revision check after another write rather than ever applying twice.
            //
            $board->forceFill(['revision' => $board->revision + 1, 'last_mutation_id' => $data->mutationId, 'last_mutation_hash' => $data->hash()])->save();

            return $board->revision;
        });
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['mutation' => $message]);
    }
}
