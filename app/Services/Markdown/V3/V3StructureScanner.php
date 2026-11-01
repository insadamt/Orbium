<?php

/**
 * Summary: Scans V3 block/column/header/body ranges without parsing adjacent Markdown as identity; depends on strict metadata decoding, bounded UTF-8 source and decreasing directive fences.
 */

namespace App\Services\Markdown\V3;

use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

final class V3StructureScanner
{
    private array $blocks = [];

    private array $columns = [];

    private array $directives = [];

    private array $diagnostics = [];

    private array $identities = [];

    private array $siblingCounts = [];

    private array $stack = [];

    private array $finishedLayouts = [];

    private array $columnCounts = [];

    private ?int $current = null;

    private ?int $layout = null;

    private ?array $literal = null;

    private int $lineNumber = 1;

    private int $lineFrom = 0;

    private int $lineTo = 0;

    public function __construct(private readonly string $source, private readonly V3Contract $contract) {}

    // ============================================================
    // Structural scan
    // ============================================================

    public function scan(): V3Structure
    {
        $limits = V3Contract::definition()['limits'];
        if (strlen($this->source) > $limits['sourceBytes'] || ! mb_check_encoding($this->source, 'UTF-8') || strpbrk($this->source, "\0\r") !== false) {
            $this->issue('invalid-source', 'V3 source must be LF-only Unicode without NUL bytes and at most 2 MiB.');

            return $this->result();
        }
        if (substr_count($this->source, "\n") + 1 > $limits['lines']) {
            $this->issue('source-limit', 'V3 source exceeds the 100,000 line limit.');

            return $this->result();
        }
        foreach (explode("\n", $this->source) as $index => $text) {
            $this->lineNumber = $index + 1;
            $this->lineTo = $this->lineFrom + strlen($text);
            $next = min(strlen($this->source), $this->lineTo + 1);
            if (strlen($text) > $limits['lineBytes']) {
                $this->issue('line-limit', 'A V3 source line exceeds 128 KiB.');

                return $this->result();
            }
            $this->scanLine($text, $next);
            $this->lineFrom = $next;
        }
        $this->finishBlock(strlen($this->source));
        foreach ($this->stack as $entry) {
            $directive = $this->directives[$entry['index']];
            $this->issueAt('unclosed-directive', 'An Orbium directive is not closed.', $directive['from'], $directive['headerTo']);
        }
        if ($this->literal !== null) {
            $this->issueAt('unclosed-literal', 'A literal code/math fence is not closed.', $this->literal['from'], $this->literal['to']);
        }

        return $this->result();
    }

    private function scanLine(string $text, int $next): void
    {
        preg_match('/^ {0,3}(`{3,}|~{3,})(.*)$/D', $text, $codeFence);
        if ($this->literal !== null) {
            if ($this->literal['marker'] === '$' ? preg_match('/^ {0,3}\$\$[ \t]*$/D', $text)
                : ($codeFence && $codeFence[1][0] === $this->literal['marker'] && strlen($codeFence[1]) >= $this->literal['length'] && preg_match('/^[ \t]*$/D', $codeFence[2]))) {
                $this->literal = null;
            }

            return;
        }
        $top = $this->stack === [] ? null : $this->stack[array_key_last($this->stack)];
        $directive = $top === null ? null : $this->directives[$top['index']];
        $structuralScope = $directive === null || in_array($directive['metadata']['kind'], ['columns', 'column'], true);
        if ($structuralScope && preg_match('/^ {0,3}\+\+(?:block|endblock)\b/', $text)) {
            if (($directive['metadata']['kind'] ?? null) === 'columns') {
                $this->issue('invalid-parent', 'Blocks in a layout must belong to a column.');
            } else {
                $this->openBlock($text, $next, $top);
            }

            return;
        }
        if ($directive !== null && preg_match('/^ {0,3}(:{3,})[ \t]*$/D', $text, $closing) && strlen($closing[1]) === $directive['fence']) {
            $this->closeDirective($top, $next);

            return;
        }
        if (preg_match('/^ {0,3}(:{3,})orbium\b(.*)$/D', $text, $opening)) {
            $this->openDirective(strlen($opening[1]), trim($opening[2], " \t"), $next, $directive);

            return;
        }
        if (preg_match('/[^ \t]/', $text) && $this->current === null) {
            $this->issue('unowned-content', 'Content must belong to an explicit block; layouts may contain only column directives.');
        }
        if ($this->current !== null && $this->blocks[$this->current]['type'] === 'columns' && preg_match('/[^ \t]/', $text)) {
            $this->issue('invalid-layout-body', 'A columns block may contain only its columns directive.');
        }
        if ($codeFence && ! ($codeFence[1][0] === '`' && str_contains($codeFence[2], '`'))) {
            $this->literal = ['marker' => $codeFence[1][0], 'length' => strlen($codeFence[1]), 'from' => $this->lineFrom, 'to' => $this->lineTo];
        } elseif (preg_match('/^ {0,3}\$\$[ \t]*$/D', $text)) {
            $this->literal = ['marker' => '$', 'length' => 2, 'from' => $this->lineFrom, 'to' => $this->lineTo];
        }
    }

    private function openBlock(string $text, int $next, ?array $top): void
    {
        $this->finishBlock($this->lineFrom);
        try {
            $header = $this->contract->decodeHeader($text);
            if (count($this->blocks) >= V3Contract::definition()['limits']['blocks']) {
                throw new InvalidArgumentException('V3 block count exceeds the structural limit.');
            }
            $this->claimIdentity($header['id']);
            $parentId = isset($top['columnIndex']) ? $this->columns[$top['columnIndex']]['id'] : null;
            if ($header['type'] === 'columns' && $parentId !== null) {
                $this->issue('nested-columns', 'Nested columns are not supported.');
            }
            //
            // Prefix scope keys so PHP cannot coerce a numeric column ID into another identity.
            //
            $scopeKey = $parentId === null ? 'document' : 'column:'.$parentId;
            $order = $this->siblingCounts[$scopeKey] ?? 0;
            $this->siblingCounts[$scopeKey] = $order + 1;
            $this->current = count($this->blocks);
            $this->blocks[] = [...$header, 'parentId' => $parentId, 'order' => $order, 'from' => $this->lineFrom, 'headerTo' => $this->lineTo, 'bodyFrom' => $next, 'bodyTo' => $next, 'to' => $next];
        } catch (InvalidArgumentException $error) {
            $this->issue('invalid-header', $error->getMessage());
        }
    }

    private function openDirective(int $fence, string $json, int $next, ?array $parent): void
    {
        try {
            $metadata = $this->contract->decodeDirective($json);
            if (count($this->stack) >= V3Contract::definition()['limits']['depth'] || ($parent !== null && $fence >= $parent['fence'])) {
                throw new InvalidArgumentException('Directive fences must decrease inside a container and stay within the nesting limit.');
            }
            $owner = $this->current ?? $this->layout;
            if ($owner === null) {
                throw new InvalidArgumentException('An Orbium directive needs an owning block.');
            }
            $entry = ['index' => count($this->directives)];
            if ($metadata['kind'] === 'columns') {
                if ($this->layout !== null || $this->stack !== [] || $this->blocks[$owner]['type'] !== 'columns' || isset($this->finishedLayouts[$owner])) {
                    throw new InvalidArgumentException('Only a root columns block can own a columns directive.');
                }
                if (preg_match('/[^ \t\n]/', substr($this->source, $this->blocks[$owner]['bodyFrom'], $this->lineFrom - $this->blocks[$owner]['bodyFrom']))) {
                    throw new InvalidArgumentException('A columns body must start with its layout directive.');
                }
                $entry['layoutIndex'] = $owner;
                $this->layout = $owner;
                $this->current = null;
            } elseif ($metadata['kind'] === 'column') {
                if (($parent['metadata']['kind'] ?? null) !== 'columns' || $this->layout === null) {
                    throw new InvalidArgumentException('A column must be a direct child of a columns layout.');
                }
                $order = $this->columnCounts[$this->layout] ?? 0;
                if ($order >= 3) {
                    throw new InvalidArgumentException('A layout supports at most three columns.');
                }
                $this->claimIdentity($metadata['id']);
                $entry['columnIndex'] = count($this->columns);
                $layoutId = $this->blocks[$this->layout]['id'];
                $this->columnCounts[$this->layout] = $order + 1;
                $this->columns[] = ['id' => $metadata['id'], 'layoutId' => $layoutId, 'order' => $order, 'from' => $this->lineFrom, 'headerTo' => $this->lineTo, 'bodyFrom' => $next, 'bodyTo' => $next, 'to' => $next];
                $this->current = null;
            } elseif ($this->current === null || $this->blocks[$this->current]['type'] === 'columns') {
                throw new InvalidArgumentException('Presentation and rich directives need an ordinary owning block.');
            }
            $this->directives[] = ['blockId' => $this->blocks[$owner]['id'], 'fence' => $fence, 'metadata' => $metadata, 'from' => $this->lineFrom, 'headerTo' => $this->lineTo, 'bodyFrom' => $next, 'bodyTo' => $next, 'to' => $next];
            $this->stack[] = $entry;
        } catch (InvalidArgumentException|ValidationException $error) {
            $message = $error instanceof ValidationException ? 'Invalid Orbium directive metadata.' : $error->getMessage();
            $this->issue('invalid-directive', $message);
        }
    }

    private function closeDirective(array $top, int $next): void
    {
        $index = $top['index'];
        $this->directives[$index]['bodyTo'] = $this->lineFrom;
        $this->directives[$index]['to'] = $next;
        array_pop($this->stack);
        if (isset($top['columnIndex'])) {
            $this->finishBlock($this->lineFrom);
            $this->columns[$top['columnIndex']]['bodyTo'] = $this->lineFrom;
            $this->columns[$top['columnIndex']]['to'] = $next;
        }
        if (isset($top['layoutIndex'])) {
            $blockIndex = $top['layoutIndex'];
            $this->blocks[$blockIndex]['bodyTo'] = $this->lineTo;
            $this->blocks[$blockIndex]['to'] = $next;
            $count = $this->columnCounts[$blockIndex] ?? 0;
            if ($count !== count($this->directives[$index]['metadata']['widths'])) {
                $this->issue('column-count', 'Column count must match the saved widths.');
            }
            $this->finishedLayouts[$blockIndex] = true;
            $this->layout = $this->current = null;
        }
    }

    private function finishBlock(int $to): void
    {
        if ($this->current === null) {
            return;
        }
        $index = $this->current;
        $this->blocks[$index]['to'] = $this->blocks[$index]['bodyTo'] = $to;
        if ($this->blocks[$index]['type'] === 'columns' && ! isset($this->finishedLayouts[$index])) {
            $this->issueAt('missing-layout', 'A columns block needs one complete columns directive.', $this->blocks[$index]['from'], $this->blocks[$index]['headerTo']);
        }
        $this->current = null;
    }

    private function claimIdentity(string $id): void
    {
        if (isset($this->identities[$id])) {
            $this->issue('duplicate-id', 'Duplicate block/column ID: '.$id.'.');
        }
        $this->identities[$id] = true;
    }

    private function issue(string $code, string $message): void
    {
        if (count($this->diagnostics) < V3Contract::definition()['limits']['diagnostics']) {
            $this->diagnostics[] = ['code' => $code, 'message' => $message, 'from' => $this->lineFrom, 'to' => $this->lineTo, 'line' => $this->lineNumber];
        }
    }

    private function issueAt(string $code, string $message, int $from, int $to): void
    {
        if (count($this->diagnostics) < V3Contract::definition()['limits']['diagnostics']) {
            $this->diagnostics[] = ['code' => $code, 'message' => $message, 'from' => $from, 'to' => $to, 'line' => substr_count(substr($this->source, 0, $from), "\n") + 1];
        }
    }

    private function result(): V3Structure
    {
        return new V3Structure(strlen($this->source), $this->blocks, $this->columns, $this->directives, $this->diagnostics);
    }
}
