<?php

/**
 * Summary: Interprets internal lines of one identified heading as heading inline content for all server readers; depends on a validated first heading, presentation wrappers and CommonMark's safe inline parser.
 */

namespace App\Services\Markdown\V3;

use App\Services\Markdown\OrbiumBlock;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Inline\Newline;
use League\CommonMark\Node\Node;
use League\CommonMark\Parser\InlineParserEngine;

final class V3HeadingBody
{
    public function enforce(Document $document, string $source, int $level, Environment $environment): Document
    {
        $container = $document;
        $first = $document->firstChild();
        $sourceLines = explode("\n", $source);
        while ($first instanceof OrbiumBlock && $first->kind() === 'block') {
            $container = $first;
            $source = implode("\n", array_slice($sourceLines, $first->getStartLine(), $first->getEndLine() - $first->getStartLine() - 1));
            $first = $first->firstChild();
        }
        if (! $first instanceof Heading || $first->getLevel() !== $level) {
            return $document;
        }
        $lines = explode("\n", trim($source, "\n"));
        if (preg_match('/^ {0,3}#{'.$level.'}(?:[ \t]+|$)/', $lines[0], $prefix)) {
            $lines[0] = substr($lines[0], strlen($prefix[0]));
            $lines[0] = preg_replace('/[ \t]+#+[ \t]*$/D', '', $lines[0]);
        } else {
            //
            // Setext imports retain their title lines; only their parsed underline is syntax.
            //
            foreach ($lines as $offset => $line) {
                if (preg_match('/^ {0,3}(?:=+|-+)[ \t]*$/D', $line)) {
                    array_splice($lines, $offset, 1);
                    break;
                }
            }
        }
        $heading = new Heading($level);
        $heading->setStartLine($first->getStartLine());
        $heading->setEndLine($first->getStartLine() + count($lines) - 1);
        (new InlineParserEngine($environment, $document->getReferenceMap()))->parse(implode("\n", $lines), $heading);
        $this->preserveLineBreaks($heading);
        foreach (iterator_to_array($container->children(), false) as $child) {
            $child->detach();
        }
        $container->appendChild($heading);

        return $document;
    }

    private function preserveLineBreaks(Node $node): void
    {
        foreach (iterator_to_array($node->children(), false) as $child) {
            if ($child instanceof Newline) {
                $child->replaceWith(new Newline(Newline::HARDBREAK));
            } else {
                $this->preserveLineBreaks($child);
            }
        }
    }
}
