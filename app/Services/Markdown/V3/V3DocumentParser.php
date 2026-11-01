<?php

/**
 * Summary: Builds a safe, explicitly scoped V3 body AST for every server reader; depends on the structural index and the existing CommonMark body validator so identities never become prose or leak reference scope.
 */

namespace App\Services\Markdown\V3;

use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\OrbiumBlock;
use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Node;

final class V3DocumentParser
{
    public function parse(string $source, MarkdownParserService $parser): Document
    {
        $structure = (new V3StructureParser)->parse($source)->requireValid();
        $document = new Document;
        $columns = [];
        $previousBodyFrom = 0;
        $lineOffset = 0;
        foreach ($structure->blocks as $block) {
            if ($block['type'] === 'columns') {
                $directive = array_find($structure->directives, fn ($entry) => $entry['blockId'] === $block['id']);
                $layout = new OrbiumBlock($directive['metadata'], $directive['fence']);
                $layout->data->set('v3', ['id' => $block['id'], 'type' => $block['type']]);
                $document->appendChild($layout);
                foreach ($structure->columns as $column) {
                    if ($column['layoutId'] !== $block['id']) {
                        continue;
                    }
                    $node = new OrbiumBlock(['kind' => 'column', 'id' => $column['id']], $column['fence'] ?? 3);
                    $layout->appendChild($node);
                    $columns[$column['id']] = $node;
                }

                continue;
            }
            $body = substr($source, $block['bodyFrom'], $block['bodyTo'] - $block['bodyFrom']);
            $bodyDocument = $parser->parseBody($body, $block['type']);
            (new V3BodyTypeValidator)->validate($bodyDocument, $block['type'], $body);
            $bodyDocument->data->set('v3', ['id' => $block['id'], 'type' => $block['type']]);
            $lineOffset += substr_count(substr($source, $previousBodyFrom, $block['bodyFrom'] - $previousBodyFrom), "\n");
            $previousBodyFrom = $block['bodyFrom'];
            $this->offsetLines($bodyDocument, $lineOffset);
            ($block['parentId'] === null ? $document : $columns[$block['parentId']])->appendChild($bodyDocument);
        }
        $count = 0;
        $this->requireBoundedTree($document, 0, $count);

        return $document;
    }

    private function offsetLines(Node $node, int $offset): void
    {
        if ($node instanceof AbstractBlock) {
            $node->setStartLine($node->getStartLine() + $offset);
            $node->setEndLine($node->getEndLine() + $offset);
        }
        foreach ($node->children() as $child) {
            $this->offsetLines($child, $offset);
        }
    }

    private function requireBoundedTree(Node $node, int $depth, int &$count): void
    {
        if ($depth > MarkdownContract::MAX_DEPTH || ++$count > MarkdownContract::MAX_NODES) {
            MarkdownContract::invalid('V3 content exceeds the nesting or node complexity limit.');
        }
        foreach ($node->children() as $child) {
            $this->requireBoundedTree($child, $depth + 1, $count);
        }
    }
}
