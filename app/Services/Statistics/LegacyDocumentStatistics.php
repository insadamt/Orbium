<?php

namespace App\Services\Statistics;

use App\Services\MindMaps\MindMapData;

final class LegacyDocumentStatistics
{
    /** @param array<string, mixed> $content */
    public function project(array $content): DocumentStatisticsData
    {
        $blocks = [];
        $checked = 0;
        $inlineMath = 0;
        $text = $this->visit($content, null, false, $blocks, $checked, $inlineMath);

        return new DocumentStatisticsData($text, $blocks, $checked, $inlineMath);
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  array<string, int>  $blocks
     */
    private function visit(array $node, ?string $parent, bool $insideTable, array &$blocks, int &$checked, int &$inlineMath): string
    {
        $type = $node['type'] ?? '';
        $attrs = $node['attrs'] ?? [];
        $blockType = match ($type) {
            'paragraph' => in_array($parent, ['listItem', 'taskItem', 'blockquote', 'callout'], true) ? null : 'paragraph',
            'heading' => 'heading_'.($attrs['level'] ?? 1),
            'listItem' => $parent === 'orderedList' ? 'numbered_list_item' : 'bullet_list_item',
            'taskItem' => 'checklist_item',
            'blockquote' => 'quote',
            'codeBlock' => 'code',
            'blockMath' => 'math',
            'horizontalRule' => 'divider',
            'callout', 'table', 'image', 'file', 'mermaid', 'mindmap' => $type,
            default => null,
        };
        if ($type === 'inlineMath') {
            $inlineMath++;
        }
        if ($type === 'taskItem' && ! $insideTable && ($attrs['checked'] ?? false)) {
            $checked++;
        }
        $parts = [];
        foreach ($node['content'] ?? [] as $child) {
            $parts[] = $this->visit($child, $type, $insideTable || $type === 'table', $blocks, $checked, $inlineMath);
        }
        $text = match ($type) {
            'text' => (string) ($node['text'] ?? ''),
            'mention', 'inlineIcon' => (string) ($attrs['label'] ?? ''),
            'blockMath', 'inlineMath' => (string) ($attrs['latex'] ?? ''),
            'mindmap' => app(MindMapData::class)->text($attrs['mindmap']),
            'mermaid' => (string) ($attrs['source'] ?? ''),
            'image' => implode(' ', array_filter([$attrs['alt'] ?? '', $attrs['caption'] ?? ''])),
            'file' => (string) ($attrs['name'] ?? $attrs['fileName'] ?? ''),
            'hardBreak' => ' ',
            default => implode(in_array($type, ['doc', 'bulletList', 'orderedList', 'taskList', 'listItem', 'taskItem', 'blockquote', 'callout', 'table', 'tableRow', 'tableCell', 'tableHeader'], true) ? ' ' : '', $parts),
        };
        if (! $insideTable && $blockType !== null && ($blockType !== 'paragraph' || preg_match('/[^\s\p{Z}]/u', $text))) {
            $blocks[$blockType] = ($blocks[$blockType] ?? 0) + 1;
        }

        return $text;
    }
}
