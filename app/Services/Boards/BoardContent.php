<?php

namespace App\Services\Boards;

use App\Models\Board;
use App\Models\Node;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class BoardContent
{
    public const FORMAT_VERSION = 4;

    public const MAX_OBJECTS = 1000;

    public function snapshot(Node $node): array
    {
        // Hold the revision stable while reading its objects, even during a concurrent save.

        return DB::transaction(function () use ($node): array {
            $board = Board::query()->whereKey($node->id)->sharedLock()->first();
            abort_if($board !== null && $board->format_version !== self::FORMAT_VERSION, 422, 'This Board format needs a newer Orbium version.');

            return [
                'format_version' => self::FORMAT_VERSION,
                'revision' => $board?->revision ?? 0,
                'objects' => $board?->objects()->orderBy('layer')->orderBy('object_id')->get()->map(fn ($object) => [
                    'id' => $object->object_id,
                    ...$object->only(['block_type', 'content_format_version', 'x', 'y', 'width', 'height', 'layer']),
                    ...($object->content_format_version === 1 ? ['data' => (object) $object->data] : ['markdown' => $object->markdown]),
                ])->all() ?? [],
            ];
        });
    }

    public function validateObjects(Node $node, array $objects): array
    {
        $totalBytes = 0;
        $seenIds = [];
        $blocks = app(BoardBlockData::class);
        foreach ($objects as &$object) {
            $object['id'] = strtolower($object['id']);
            if (isset($seenIds[$object['id']])) {
                throw ValidationException::withMessages(['objects' => 'Each Board object needs a unique identity.']);
            }
            $seenIds[$object['id']] = true;
            $object['data'] = $blocks->validate($object['block_type'], $object['data']);
            $encoded = json_encode($object['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $totalBytes += strlen($encoded);
            if (strlen($encoded) > 262144 || $totalBytes > 4194304 || app(BoardBlockData::class)->containsNul($object['data'])) {
                throw ValidationException::withMessages(['objects' => 'Use at most 256 KiB of data per block and 4 MiB per Board, without NUL characters.']);
            }
            foreach (['x', 'y', 'width', 'height'] as $field) {
                $object[$field] = (float) $object[$field];
                if (! is_finite($object[$field])) {
                    throw ValidationException::withMessages(['objects' => 'Use finite canvas geometry.']);
                }
            }
            $object['layer'] = (int) $object['layer'];
            $object['content_format_version'] = 1;
        }
        $blocks->validateAttachments($node, $objects);
        app(BoardResourceReferences::class)->validate($node, $objects);

        return $objects;
    }
}
