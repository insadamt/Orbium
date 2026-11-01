<?php

/**
 * Summary: Validates saved body syntax against its authoritative V3 type and preserves explicitly forced code; depends on the existing safe body AST and rich presentation wrappers.
 */

namespace App\Services\Markdown\V3;

use App\Services\Markdown\CalloutMarker;
use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MathBlock;
use App\Services\Markdown\OrbiumBlock;
use League\CommonMark\Extension\CommonMark\Node\Block\BlockQuote;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Block\IndentedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\ListBlock;
use League\CommonMark\Extension\CommonMark\Node\Block\ThematicBreak;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\Table\Table;
use League\CommonMark\Extension\TaskList\TaskListItemMarker;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Block\Paragraph;

final class V3BodyTypeValidator
{
    public function validate(Document $document, string $type, string $body): void
    {
        if ($type === 'spacer') {
            if (preg_match('/[^ \t\n]/', $body) || $document->firstChild() !== null) {
                MarkdownContract::invalid('An empty-space block cannot contain editable content.');
            }

            return;
        }
        $node = $document->firstChild();
        while ($node instanceof OrbiumBlock && $node->kind() === 'block') {
            if ($node->next() !== null) {
                MarkdownContract::invalid('A V3 presentation block cannot own unrelated sibling content.');
            }
            $node = $node->firstChild();
        }
        if ($node instanceof OrbiumBlock && $node->next() !== null) {
            MarkdownContract::invalid('A V3 rich block cannot own unrelated sibling content.');
        }
        $valid = match (true) {
            $type === 'paragraph' => $node === null || $node instanceof Paragraph || ($node instanceof OrbiumBlock && $node->kind() === 'empty'),
            str_starts_with($type, 'heading-') => ($node instanceof Heading && $node->getLevel() === (int) substr($type, -1)) || trim($body) === str_repeat('#', (int) substr($type, -1)),
            $type === 'bullet-list', $type === 'checklist' => ($node instanceof ListBlock && $node->getListData()->type === ListBlock::TYPE_BULLET && ($type !== 'checklist' || $node->firstChild()?->firstChild()?->firstChild() instanceof TaskListItemMarker)) || preg_match('/^\s*[-+*]\s*(?:\[ \])?\s*$/D', $body),
            $type === 'numbered-list' => ($node instanceof ListBlock && $node->getListData()->type === ListBlock::TYPE_ORDERED) || preg_match('/^\s*\d+[.)]\s*$/D', $body),
            $type === 'quote', $type === 'callout' => ($node instanceof BlockQuote && ($type !== 'callout' || $node->firstChild()?->firstChild() instanceof CalloutMarker)) || trim($body) === '>',
            $type === 'divider' => $node instanceof ThematicBreak,
            $type === 'code', $type === 'mermaid' => $node instanceof FencedCode || $node instanceof IndentedCode || ($node instanceof OrbiumBlock && $node->kind() === 'code'),
            $type === 'math' => $node instanceof MathBlock || ($node instanceof OrbiumBlock && $node->kind() === 'math'),
            $type === 'table' => $node instanceof Table || ($node instanceof OrbiumBlock && $node->kind() === 'table'),
            $type === 'mindmap' => $node instanceof OrbiumBlock && $node->kind() === 'mindmap',
            $type === 'image' => ($node instanceof OrbiumBlock && $node->kind() === 'image') || ($node instanceof Paragraph && $node->firstChild() instanceof Image),
            in_array($type, ['file', 'video', 'audio', 'pdf'], true) => $node instanceof Paragraph && $node->firstChild() instanceof Link,
            default => false,
        };
        if (! $valid) {
            MarkdownContract::invalid('The body does not match its explicit V3 type "'.$type.'". Change the type with a block control or repair Source mode.');
        }
        //
        // Validate every effective body node; a valid first heading/list/code node must not authorize unrelated later payloads.
        //
        for ($sibling = $node?->next(); $sibling !== null; $sibling = $sibling->next()) {
            $matches = match (true) {
                $type === 'paragraph' => $sibling instanceof Paragraph,
                str_starts_with($type, 'heading-') => $sibling instanceof Heading && $sibling->getLevel() === (int) substr($type, -1),
                $type === 'bullet-list', $type === 'checklist' => $sibling instanceof ListBlock && $sibling->getListData()->type === ListBlock::TYPE_BULLET && ($type !== 'checklist' || $sibling->firstChild()?->firstChild()?->firstChild() instanceof TaskListItemMarker),
                $type === 'numbered-list' => $sibling instanceof ListBlock && $sibling->getListData()->type === ListBlock::TYPE_ORDERED,
                $type === 'quote' => $sibling instanceof BlockQuote,
                default => false,
            };
            if (! $matches) {
                MarkdownContract::invalid('Every body node must match its explicit V3 type "'.$type.'". Split unrelated content into identified blocks.');
            }
        }
        $walker = $document->walker();
        while ($event = $walker->next()) {
            $child = $event->getNode();
            if ($event->isEntering() && $child instanceof FencedCode && in_array($type, ['code', 'mermaid'], true)) {
                $child->data->set('v3_force_code', $type === 'code');
                $child->data->set('v3_force_mermaid', $type === 'mermaid');
            }
        }
    }
}
