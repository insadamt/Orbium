<?php

/**
 * Summary: Detects saved column layouts to reject clients that could flatten them.
 * Depends on the canonical Markdown parser, so code samples are never mistaken for layouts.
 */

namespace App\Services\Markdown;

use League\CommonMark\Node\Node;

final class MarkdownColumnLayout
{
    public function containsColumns(string $source): bool
    {
        if (! str_contains($source, 'orbium ')) {
            return false;
        }

        return $this->nodeContainsColumns(app(MarkdownParserService::class)->parse($source));
    }

    private function nodeContainsColumns(Node $node): bool
    {
        if ($node instanceof OrbiumBlock && $node->kind() === 'columns') {
            return true;
        }
        foreach ($node->children() as $child) {
            if ($this->nodeContainsColumns($child)) {
                return true;
            }
        }

        return false;
    }
}
