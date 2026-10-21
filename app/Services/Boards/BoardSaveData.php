<?php

namespace App\Services\Boards;

final readonly class BoardSaveData
{
    /** @param list<array<string, mixed>> $objects */
    public function __construct(
        public int $revision,
        public array $objects,
    ) {}
}
