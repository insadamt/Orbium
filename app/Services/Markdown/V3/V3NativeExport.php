<?php

/**
 * Summary: Preserves V3 source bytes and identities while replacing explicitly omitted reference destinations; depends on scoped AST proof, bounded candidate work and Mind Map icon validation.
 */

namespace App\Services\Markdown\V3;

use App\Services\DocumentTransfer\TransferSerializationOptions;
use App\Services\Markdown\MarkdownAstSnapshot;
use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\OrbiumBlock;
use App\Services\MindMaps\MindMapIconReferences;
use Illuminate\Validation\ValidationException;

final class V3NativeExport
{
    public function serialize(string $source, TransferSerializationOptions $options): string
    {
        $source = MarkdownContract::normalizeSource($source);
        $parser = app(MarkdownParserService::class);
        $document = $parser->parse($source);
        if ($options->nodeDestinations === [] && $options->attachmentDestinations === []) {
            return $source;
        }
        $snapshots = app(MarkdownAstSnapshot::class);
        $original = $snapshots->capture($document);
        preg_match_all('~orbium:(node|attachment)/[1-9][0-9]*~', $source, $matches, PREG_OFFSET_CAPTURE);
        if (count($matches[0]) > 256 || (count($matches[0]) + 5) * strlen($source) > 33554432) {
            MarkdownContract::invalid('Reference export exceeds its bounded parsing budget.');
        }
        $replacements = [];
        foreach ($matches[0] as [$spelling, $offset]) {
            preg_match('~^orbium:(node|attachment)/([1-9][0-9]*)$~D', $spelling, $match);
            $destination = ($match[1] === 'node' ? $options->nodeDestinations : $options->attachmentDestinations)[(int) $match[2]] ?? null;
            if ($destination === null) {
                continue;
            }
            $probe = 'orbium:'.$match[1].'/'.(PHP_INT_MAX - $offset);
            try {
                $candidate = $snapshots->capture($parser->parse(substr_replace($source, $probe, $offset, strlen($spelling))));
            } catch (ValidationException) {
                continue;
            }
            $changed = false;
            $imageReference = false;
            $linkReference = false;
            $safe = count($candidate) === count($original);
            foreach ($original as $index => $before) {
                $after = $candidate[$index] ?? null;
                if ($after === null || $before->structure !== $after->structure) {
                    $safe = false;
                    break;
                }
                if ($before->destination !== $after->destination) {
                    if ($before->destination !== $spelling || $after->destination !== $probe) {
                        $safe = false;
                        break;
                    }
                    $changed = true;
                    $imageReference = $imageReference || str_contains($before->structure, 'Node\\\\Inline\\\\Image');
                    $linkReference = $linkReference || str_contains($before->structure, 'Node\\\\Inline\\\\Link');
                }
            }
            if ($safe && $changed) {
                if ($imageReference && $linkReference && str_starts_with($destination, '#orbium-missing-')) {
                    MarkdownContract::invalid('A shared image/file reference definition needs explicit inline destinations before exporting omitted assets.');
                }
                $replacements[] = [$offset, strlen($spelling), $imageReference ? str_replace('#orbium-missing-file-', '#orbium-missing-image-', $destination) : $destination];
            }
        }
        foreach (array_reverse($replacements) as [$offset, $length, $destination]) {
            $source = substr_replace($source, $destination, $offset, $length);
        }
        $omittedIds = array_keys(array_filter($options->attachmentDestinations, fn ($destination) => str_starts_with($destination, '#orbium-missing-')));
        $lines = explode("\n", $source);
        $walker = $parser->parse($source)->walker();
        while ($event = $walker->next()) {
            $node = $event->getNode();
            if (! $event->isEntering() || ! $node instanceof OrbiumBlock || $node->kind() !== 'mindmap') {
                continue;
            }
            $metadata = $node->metadata;
            $metadata['mindmap'] = app(MindMapIconReferences::class)->replaceOmittedIconsWithLabels($metadata['mindmap'], $omittedIds);
            if ($metadata !== $node->metadata) {
                $index = $node->getStartLine() - 1;
                $lines[$index] = substr($lines[$index], 0, strpos($lines[$index], '{')).json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            }
        }

        return implode("\n", $lines);
    }
}
