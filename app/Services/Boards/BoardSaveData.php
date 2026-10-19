<?php

namespace App\Services\Boards;

final readonly class BoardSaveData
{
    public function __construct(
        public int $revision,
        public array $objects,
    ) {}
}
