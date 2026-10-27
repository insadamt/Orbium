<?php

namespace App\Services\Markdown;

use App\Services\MindMaps\MindMapIconReferences;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Inline\AbstractWebResource;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\StringContainerInterface;

final class MarkdownAstSnapshot
{
    /** @return list<MarkdownNodeSnapshot> */
    public function capture(Node $node, int $depth = 0, ?array $attachmentIds = null): array
    {
        $values = [$node::class, $depth];
        if ($node instanceof StringContainerInterface) {
            $values[] = $node->getLiteral();
        }
        if ($node instanceof FencedCode) {
            $values[] = $node->getInfo();
        }
        if ($node instanceof OrbiumBlock || $node instanceof OrbiumInline) {
            $metadata = $node->metadata;
            if ($attachmentIds !== null && $node instanceof OrbiumBlock && $node->kind() === 'mindmap') {
                $metadata['mindmap'] = app(MindMapIconReferences::class)->remap($metadata['mindmap'], $attachmentIds);
            }
            $values[] = $metadata;
        }
        if ($node instanceof OrbiumInline) {
            $values[] = $node->latex;
        }
        if ($node instanceof CalloutMarker) {
            $values[] = [$node->type, $node->folding];
        }
        if (method_exists($node, 'getTitle')) {
            $values[] = $node->getTitle();
        }
        $snapshot = [new MarkdownNodeSnapshot(json_encode($values, JSON_THROW_ON_ERROR), $node instanceof AbstractWebResource ? $node->getUrl() : null)];
        if ($node instanceof Document) {
            foreach ($node->getReferenceMap() as $definition) {
                $snapshot[] = new MarkdownNodeSnapshot(json_encode([
                    'reference-definition', $definition->getLabel(), $definition->getTitle(),
                ], JSON_THROW_ON_ERROR), $definition->getDestination());
            }
        }
        foreach ($node->children() as $child) {
            array_push($snapshot, ...$this->capture($child, $depth + 1, $attachmentIds));
        }

        return $snapshot;
    }
}
