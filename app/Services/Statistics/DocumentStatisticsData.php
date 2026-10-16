<?php

namespace App\Services\Statistics;

final readonly class DocumentStatisticsData
{
    public const VERSION = 1;

    public const BLOCK_TYPES = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'heading_4', 'heading_5', 'heading_6',
        'bullet_list_item', 'numbered_list_item', 'checklist_item', 'quote', 'callout', 'code', 'table', 'image', 'file', 'divider', 'mermaid', 'math'];

    /** @param array<string, int> $blocks */
    public function __construct(
        public string $text,
        public array $blocks,
        public int $checkedChecklistCount,
        public int $inlineMathCount,
    ) {}

    /**
     * @param  array<int, int>  $attachmentIds
     * @return array<string, mixed>
     */
    public function attributes(array $attachmentIds = []): array
    {
        $text = trim(preg_replace('/[\s\p{Z}]+/u', ' ', $this->text) ?? '');
        $words = preg_match_all('/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:[\x{0027}\x{2019}\x{002D}][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/u', $text);

        return [
            'word_count' => $words === false ? 0 : $words,
            'character_count' => mb_strlen($text),
            'character_count_without_spaces' => mb_strlen(str_replace(' ', '', $text)),
            'block_counts' => array_replace(array_fill_keys(self::BLOCK_TYPES, 0), $this->blocks),
            'checked_checklist_count' => $this->checkedChecklistCount,
            'inline_math_count' => $this->inlineMathCount,
            'body_attachment_ids' => array_values(array_unique($attachmentIds)),
            'statistics_version' => self::VERSION,
        ];
    }
}
