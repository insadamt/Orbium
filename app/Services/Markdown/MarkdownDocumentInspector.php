<?php

namespace App\Services\Markdown;

use App\Services\Editor\DocumentInspectionResult;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Inline\AbstractWebResource;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\Table\TableRow;
use League\CommonMark\Extension\TaskList\TaskListItemMarker;
use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Inline\Newline;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\StringContainerInterface;

final class MarkdownDocumentInspector
{
    public function __construct(private readonly MarkdownParserService $parser) {}

    public function inspect(string $source): MarkdownInspectionResult
    {
        $source = MarkdownContract::normalizeSource($source);
        $document = $this->parser->parse($source);
        foreach ($document->getReferenceMap() as $definition) {
            $this->semanticReference(new Link($definition->getDestination()));
        }
        $mentions = [];
        $attachments = [];
        $mermaid = [];
        $references = [];
        $plainText = $this->deriveText($document, $mentions, $attachments, $mermaid, $references);

        return new MarkdownInspectionResult($source, new DocumentInspectionResult($mentions, array_keys($attachments), $plainText, $mermaid), $references);
    }

    /**
     * @param  array<int, string>  $mentions
     * @param  array<int, true>  $attachments
     * @param  array<string, string>  $mermaid
     * @param  list<MarkdownAttachmentReference>  $references
     */
    private function deriveText(Node $node, array &$mentions, array &$attachments, array &$mermaid, array &$references): string
    {
        if ($node instanceof FencedCode) {
            $source = $this->withoutStructuralNewline($node->getLiteral());
            $infoToken = strtolower(explode(' ', str_replace("\t", ' ', $node->getInfo()))[0]);
            $parent = $node->parent();
            if ($infoToken === 'mermaid' && ! ($parent instanceof OrbiumBlock && $parent->kind() === 'code')) {
                if (strlen($source) > 50000) {
                    MarkdownContract::invalid('Mermaid source exceeds the 50,000 byte preview limit.', $node->getStartLine());
                }
                $mermaid[hash('sha256', $source)] = $source;
            }

            return $source;
        }
        if ($node instanceof OrbiumInline && $node->latex !== null) {
            return $node->latex;
        }
        if ($node instanceof StringContainerInterface) {
            return $node->getLiteral();
        }
        if ($node instanceof Newline) {
            return $node->getType() === Newline::HARDBREAK || $node->parent()?->firstChild() instanceof CalloutMarker ? "\n" : ' ';
        }
        if ($node instanceof TaskListItemMarker || $node instanceof CalloutMarker) {
            return '';
        }
        if ($node instanceof OrbiumBlock && $node->kind() === 'math') {
            return (string) $node->metadata['latex'];
        }
        $parts = [];
        foreach ($node->children() as $child) {
            if ($child instanceof Paragraph && $child->onlyContainsLinkReferenceDefinitions) {
                continue;
            }
            $parts[] = $this->deriveText($child, $mentions, $attachments, $mermaid, $references);
        }
        $separator = $node instanceof TableRow || ($node instanceof OrbiumBlock && $node->kind() === 'row') ? "\t"
            : ($node instanceof AbstractBlock && ! $this->containsInlines($node) ? "\n" : '');
        $text = implode($separator, $parts);
        if ($node->firstChild() instanceof TaskListItemMarker || $node->firstChild() instanceof CalloutMarker) {
            $text = ltrim($text, " \t");
        }
        if ($node instanceof AbstractWebResource) {
            $reference = $this->semanticReference($node);
            if ($reference !== null) {
                [$kind, $id] = $reference;
                if ($kind === 'node') {
                    $label = str_starts_with($text, '@') ? substr($text, 1) : $text;
                    $mentions[$id] = $label;
                    $text = '@'.$label;
                } else {
                    $attachments[$id] = true;
                    $references[] = new MarkdownAttachmentReference($id, $node instanceof Image, $this->sourceLine($node));
                }
            }
        }
        if ($node instanceof OrbiumBlock && $node->kind() === 'image' && ($node->metadata['caption'] ?? '') !== '') {
            $text .= "\n".$node->metadata['caption'];
        }

        return $text;
    }

    /** @return array{string, int}|null */
    public function semanticReference(AbstractWebResource $node): ?array
    {
        $url = $node->getUrl();
        if (! str_starts_with(strtolower($url), 'orbium:')) {
            if (! $this->isSafeUrl($url)) {
                MarkdownContract::invalid('A Markdown link has an unsafe URL.', $this->sourceLine($node));
            }

            return null;
        }
        if (! preg_match('/^orbium:(node|attachment)\/([1-9][0-9]*)$/D', $url, $matches)
            || filter_var($matches[2], FILTER_VALIDATE_INT) === false) {
            MarkdownContract::invalid('Invalid reserved Orbium reference; use orbium:node/<id> or orbium:attachment/<id>.', $this->sourceLine($node));
        }
        if ($node instanceof Image && $matches[1] === 'node') {
            MarkdownContract::invalid('A mention cannot use image syntax.', $this->sourceLine($node));
        }

        return [$matches[1], (int) $matches[2]];
    }

    private function containsInlines(AbstractBlock $node): bool
    {
        return $node->firstChild() !== null && ! $node->firstChild() instanceof AbstractBlock;
    }

    private function withoutStructuralNewline(string $source): string
    {
        return str_ends_with($source, "\n") ? substr($source, 0, -1) : $source;
    }

    private function sourceLine(Node $node): ?int
    {
        while (! $node instanceof AbstractBlock) {
            $node = $node->parent();
            if ($node === null) {
                return null;
            }
        }

        return $node->getStartLine();
    }

    private function isSafeUrl(string $url): bool
    {
        if (preg_match('/[\x00-\x20\x7f]/', $url)) {
            return false;
        }
        if (preg_match('/^([a-z][a-z0-9+.-]*):/i', $url, $matches)) {
            return in_array(strtolower($matches[1]), ['http', 'https', 'mailto'], true);
        }

        return true;
    }
}
