<?php

namespace App\Services\Markdown;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Exception\CommonMarkException;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Node;
use League\CommonMark\Parser\MarkdownParser;

final class MarkdownParserService
{
    public function parse(string $source): Document
    {
        $source = MarkdownContract::normalizeSource($source);
        $environment = new Environment([
            'max_nesting_level' => MarkdownContract::MAX_DEPTH + 1,
            'max_delimiters_per_line' => 1000,
            'html_input' => 'escape',
            'allow_unsafe_links' => false,
            'table' => ['max_autocompleted_cells' => MarkdownContract::MAX_NODES],
            'autolink' => ['allowed_protocols' => ['http', 'https']],
        ]);
        $environment->addExtension(new CommonMarkCoreExtension);
        $environment->addExtension(new GithubFlavoredMarkdownExtension);
        $environment->addBlockStartParser(new OrbiumBlockStartParser, 250);
        $environment->addBlockStartParser(new MathBlockStartParser, 250);
        $environment->addBlockStartParser(new CalloutParagraphStartParser, 250);
        $environment->addInlineParser(new OrbiumInlineParser, 250);
        $environment->addInlineParser(new CalloutInlineParser, 250);
        $environment->addInlineParser(new ReservedReferenceInlineParser, 250);
        $environment->addInlineParser(new ReservedDirectiveInlineParser, 250);
        try {
            $document = (new MarkdownParser($environment))->parse($source);
        } catch (CommonMarkException) {
            MarkdownContract::invalid('Markdown could not be parsed safely.');
        }
        $count = 0;
        $this->validateTree($document, 0, $count);

        return $document;
    }

    private function validateTree(Node $node, int $depth, int &$count): void
    {
        if ($depth > MarkdownContract::MAX_DEPTH || ++$count > MarkdownContract::MAX_NODES) {
            MarkdownContract::invalid('Markdown exceeds the nesting or node complexity limit.');
        }
        if ($node instanceof OrbiumBlock) {
            (new OrbiumStructureValidator)->validate($node);
        }
        foreach ($node->children() as $child) {
            $this->validateTree($child, $depth + 1, $count);
        }
    }
}
