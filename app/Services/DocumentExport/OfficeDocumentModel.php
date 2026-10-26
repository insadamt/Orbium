<?php

namespace App\Services\DocumentExport;

use App\Models\Node as DocumentNode;
use App\Models\Workspace;
use App\Services\Markdown\CalloutMarker;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\MathBlock;
use App\Services\Markdown\OrbiumBlock;
use App\Services\Markdown\OrbiumInline;
use App\Services\MindMaps\MindMapData;
use League\CommonMark\Extension\CommonMark\Node\Block\BlockQuote;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Block\IndentedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\ListBlock;
use League\CommonMark\Extension\CommonMark\Node\Block\ListItem;
use League\CommonMark\Extension\CommonMark\Node\Block\ThematicBreak;
use League\CommonMark\Extension\CommonMark\Node\Inline\Code;
use League\CommonMark\Extension\CommonMark\Node\Inline\Emphasis;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\CommonMark\Node\Inline\Strong;
use League\CommonMark\Extension\Strikethrough\Strikethrough;
use League\CommonMark\Extension\Table\Table;
use League\CommonMark\Extension\Table\TableCell;
use League\CommonMark\Extension\Table\TableRow;
use League\CommonMark\Extension\TaskList\TaskListItemMarker;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Inline\Newline;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\StringContainerInterface;

final class OfficeDocumentModel
{
    /** @return array<string, mixed> */
    public function build(Workspace $workspace, DocumentNode $document, string $source): array
    {
        return $this->convert(app(MarkdownParserService::class)->parse($source), $workspace, $document);
    }

    /** @return array<string, mixed> */
    private function convert(Node $node, Workspace $workspace, DocumentNode $document): array
    {
        $children = [];
        foreach ($node->children() as $child) {
            $children[] = $this->convert($child, $workspace, $document);
        }
        $value = ['kind' => 'container', 'children' => $children];
        if ($node instanceof OrbiumBlock && $node->kind() === 'mindmap') {
            return ['kind' => 'codeBlock', 'text' => app(MindMapData::class)->outline($node->metadata['mindmap']), 'language' => 'Mind Map'];
        }
        if ($node instanceof OrbiumBlock) {
            return [...$value, ...$node->metadata, 'kind' => 'orbium', 'blockKind' => $node->kind()];
        }
        if ($node instanceof OrbiumInline) {
            return [...$value, ...$node->metadata, 'kind' => $node->latex === null ? 'span' : 'math', 'text' => $node->latex ?? '', 'inline' => true];
        }
        if ($node instanceof MathBlock) {
            return ['kind' => 'math', 'text' => trim($node->getLiteral()), 'inline' => false];
        }
        if ($node instanceof FencedCode || $node instanceof IndentedCode) {
            $diagram = $node instanceof FencedCode && strtolower(explode(' ', str_replace("\t", ' ', $node->getInfo()))[0]) === 'mermaid'
                && ! ($node->parent() instanceof OrbiumBlock && $node->parent()->kind() === 'code');
            $text = rtrim($node->getLiteral(), "\n");

            return ['kind' => $diagram ? 'diagram' : 'codeBlock', 'text' => $text, 'hash' => hash('sha256', str_ends_with($node->getLiteral(), "\n") ? substr($node->getLiteral(), 0, -1) : $node->getLiteral())];
        }
        if ($node instanceof Image || $node instanceof Link) {
            return [...$value, ...app(OfficeReferenceResolver::class)->resolve($node, $workspace, $document)];
        }
        if ($node instanceof Heading) {
            return [...$value, 'kind' => 'heading', 'level' => $node->getLevel()];
        }
        if ($node instanceof ListBlock) {
            return [...$value, 'kind' => 'list', 'ordered' => $node->getListData()->type === ListBlock::TYPE_ORDERED, 'start' => $node->getListData()->start ?? 1];
        }
        if ($node instanceof TableCell) {
            return [...$value, 'kind' => 'cell', 'align' => $node->getAlign(), 'header' => $node->getType() === TableCell::TYPE_HEADER];
        }
        if ($node instanceof TaskListItemMarker) {
            return ['kind' => 'text', 'text' => $node->isChecked() ? '[x] ' : '[ ] '];
        }
        if ($node instanceof CalloutMarker) {
            return ['kind' => 'text', 'text' => ucfirst(strtolower($node->type)).': '];
        }
        if ($node instanceof Newline) {
            return ['kind' => $node->getType() === Newline::HARDBREAK ? 'break' : 'text', 'text' => ' '];
        }
        $kind = match (true) {
            $node instanceof Paragraph => 'paragraph',
            $node instanceof ListItem => 'listItem',
            $node instanceof BlockQuote => 'quote',
            $node instanceof ThematicBreak => 'divider',
            $node instanceof Table => 'table',
            $node instanceof TableRow => 'row',
            $node instanceof Strong => 'strong',
            $node instanceof Emphasis => 'emphasis',
            $node instanceof Strikethrough => 'strike',
            $node instanceof Code => 'inlineCode',
            $node instanceof StringContainerInterface => 'text',
            default => 'container',
        };
        if ($node instanceof Paragraph && $node->onlyContainsLinkReferenceDefinitions) {
            return ['kind' => 'container', 'children' => []];
        }

        return [...$value, 'kind' => $kind, 'text' => $node instanceof StringContainerInterface ? $node->getLiteral() : ''];
    }
}
