<?php

namespace App\Services\MindMaps;

use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\OrbiumBlock;

final class MindMapMarkdownReferences
{
    public function remap(string $source, array $attachmentIds): string
    {
        $document = app(MarkdownParserService::class)->parse($source);
        $lines = explode("\n", $source);
        $walker = $document->walker();
        while ($event = $walker->next()) {
            $node = $event->getNode();
            if (! $event->isEntering() || ! $node instanceof OrbiumBlock || $node->kind() !== 'mindmap' || app(MindMapIconReferences::class)->attachmentIds($node->metadata['mindmap']) === []) {
                continue;
            }
            $index = $node->getStartLine() - 1;
            if (! preg_match('/^(.*?:{3,}orbium )(\{.*\})([ \t]*)$/D', $lines[$index], $match) || json_decode($match[2], true) !== $node->metadata) {
                MarkdownContract::invalid('The Mind Map header cannot be safely remapped.');
            }
            $metadata = $node->metadata;
            $metadata['mindmap'] = app(MindMapIconReferences::class)->remap($metadata['mindmap'], $attachmentIds);
            //
            // Match the parsed header exactly so code samples and unrelated JSON are never rewritten.
            //
            $lines[$index] = $match[1].json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR).$match[3];
        }

        return implode("\n", $lines);
    }
}
