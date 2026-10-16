<?php

namespace App\Services\Statistics;

final readonly class StatisticsSummary
{
    /**
     * @param  array<string, int|null>  $content
     * @param  array<string, int>|null  $writing
     * @param  array<string, int>|null  $blocks
     * @param  array{checked: int, unchecked: int}|null  $checklist
     * @param  array<string, array{count: int, size_bytes: int}>|null  $uploads
     */
    public function __construct(
        public StatisticsScope $scope,
        public array $content,
        public ?array $writing,
        public ?array $blocks,
        public ?array $checklist,
        public ?int $inlineMath,
        public ?array $uploads,
        public int $pendingDocuments,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'scope' => $this->scope->identity(),
            'content' => $this->content,
            'writing' => $this->writing,
            'blocks' => $this->blocks,
            'total_blocks' => $this->blocks === null ? null : array_sum($this->blocks),
            'checklist' => $this->checklist,
            'inline_math' => $this->inlineMath,
            'uploads' => $this->uploads,
            'completeness' => ['complete' => $this->pendingDocuments === 0, 'pending_documents' => $this->pendingDocuments],
        ];
    }
}
