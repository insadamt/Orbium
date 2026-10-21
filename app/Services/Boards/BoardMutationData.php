<?php

namespace App\Services\Boards;

final readonly class BoardMutationData
{
    /**
     * @param  list<array<string, mixed>>  $creates
     * @param  list<array<string, mixed>>  $updates
     * @param  list<string>  $deletes
     */
    public function __construct(
        public int $revision,
        public string $mutationId,
        public array $creates,
        public array $updates,
        public array $deletes,
    ) {}

    public function hash(): string
    {
        return hash('sha256', json_encode([$this->revision, $this->creates, $this->updates, $this->deletes], JSON_THROW_ON_ERROR));
    }
}
