<?php

namespace App\Services\Boards;

final readonly class CreateBoardDocumentData
{
    public function __construct(public string $requestId, public string $title, public BoardSaveData $snapshot, public array $object) {}
}
