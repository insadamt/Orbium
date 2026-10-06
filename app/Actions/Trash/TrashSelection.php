<?php

namespace App\Actions\Trash;

class TrashSelection
{
    public function __construct(
        public array $keys,
        public bool $emptyScope = false,
        public ?int $workspaceId = null,
    ) {}

    public function resolveKeys(TrashCatalog $catalog): array
    {
        if (! $this->emptyScope) {
            return $this->keys;
        }
        if ($this->workspaceId !== null) {
            abort_unless($catalog->workspaces->has($this->workspaceId), 404);
        }

        return array_column(array_filter($catalog->roots(), fn (array $entry) => $this->workspaceId === null || $entry['workspace_id'] === $this->workspaceId), 'key');
    }
}
