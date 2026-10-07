<?php

namespace App\Services\Markdown;

use Illuminate\Validation\ValidationException;

final class MarkdownReferenceRemapper
{
    private const MAX_CANDIDATES = 256;

    private const MAX_PARSE_WORK_BYTES = 33554432;

    public function __construct(
        private readonly MarkdownParserService $parser,
        private readonly MarkdownDocumentInspector $inspector,
        private readonly MarkdownAstSnapshot $snapshot,
    ) {}

    /** @param array<int, int> $nodeIds
     * @param  array<int, int>  $attachmentIds
     */
    public function remap(string $source, array $nodeIds, array $attachmentIds): string
    {
        $inspection = $this->inspector->inspect($source);
        $source = $inspection->source;
        $original = $this->snapshot->capture($this->parser->parse($source));
        $expected = [];
        foreach ($original as $record) {
            $destination = $record->destination;
            if ($destination !== null && preg_match('/^orbium:(node|attachment)\/([1-9][0-9]*)$/D', $destination, $match)) {
                $map = $match[1] === 'node' ? $nodeIds : $attachmentIds;
                $id = $map[(int) $match[2]] ?? null;
                if (! is_int($id) || $id < 1) {
                    MarkdownContract::invalid('A semantic reference is missing a valid remapping ID.');
                }
                $destination = 'orbium:'.$match[1].'/'.$id;
            }
            $expected[] = new MarkdownNodeSnapshot($record->structure, $destination);
        }
        preg_match_all('/orbium:(node|attachment)\/[1-9][0-9]*/', $source, $candidates, PREG_OFFSET_CAPTURE);
        if (count($candidates[0]) > self::MAX_CANDIDATES || (count($candidates[0]) + 4) * strlen($source) > self::MAX_PARSE_WORK_BYTES) {
            MarkdownContract::invalid('Reference remapping exceeds its bounded parsing budget (256 candidates / 32 MiB parse work).');
        }
        // CommonMark resolves destinations without byte ranges, so each candidate needs AST proof.
        $replacements = [];
        foreach ($candidates[0] as [$spelling, $offset]) {
            if (! preg_match('/^orbium:(node|attachment)\/([1-9][0-9]*)$/D', $spelling, $match)) {
                MarkdownContract::invalid('Invalid reference remapping candidate.');
            }
            $probeId = PHP_INT_MAX - $offset;
            do {
                $probe = 'orbium:'.$match[1].'/'.$probeId--;
            } while (array_any($original, static fn (MarkdownNodeSnapshot $record): bool => $record->destination === $probe));
            $candidateSource = substr_replace($source, $probe, $offset, strlen($spelling));
            try {
                $candidate = $this->snapshot->capture($this->parser->parse($candidateSource));
            } catch (ValidationException) {
                continue;
            }
            if (! $this->changesOnlyDestination($original, $candidate, $spelling, $probe)) {
                continue;
            }
            $map = $match[1] === 'node' ? $nodeIds : $attachmentIds;
            $replacements[] = [$offset, strlen($spelling), 'orbium:'.$match[1].'/'.$map[(int) $match[2]]];
        }
        foreach (array_reverse($replacements) as [$offset, $length, $destination]) {
            $source = substr_replace($source, $destination, $offset, $length);
        }
        $actual = $this->snapshot->capture($this->parser->parse($source));
        if ($actual != $expected) {
            MarkdownContract::invalid('A reference destination uses a source spelling this remapper cannot safely rewrite; use literal orbium:<kind>/<id> destinations.');
        }
        $this->inspector->inspect($source);

        return $source;
    }

    /** @param list<MarkdownNodeSnapshot> $original
     * @param  list<MarkdownNodeSnapshot>  $candidate
     */
    private function changesOnlyDestination(array $original, array $candidate, string $destination, string $probe): bool
    {
        if (count($original) !== count($candidate)) {
            return false;
        }
        $changed = false;
        foreach ($original as $index => $before) {
            $after = $candidate[$index];
            if ($before->structure !== $after->structure) {
                return false;
            }
            if ($before->destination !== $after->destination) {
                if ($before->destination !== $destination || $after->destination !== $probe) {
                    return false;
                }
                $changed = true;
            }
        }

        return $changed;
    }
}
