<?php

namespace App\Services\Statistics;

final readonly class StatisticsScope
{
    /** @param 'account'|'workspace'|'folder'|'database'|'document' $kind */
    public function __construct(
        public int $userId,
        public string $kind,
        public string $name,
        public ?int $workspaceId = null,
        public ?int $nodeId = null,
    ) {}

    /** @return array{kind: string, name: string, workspace_id: ?int, node_id: ?int} */
    public function identity(): array
    {
        return ['kind' => $this->kind, 'name' => $this->name, 'workspace_id' => $this->workspaceId, 'node_id' => $this->nodeId];
    }
}
