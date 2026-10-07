<?php

namespace App\Services\Markdown;

use JsonException;

final class OrbiumMetadata
{
    public function objectLength(string $source): int
    {
        if (! str_starts_with($source, '{')) {
            MarkdownContract::invalid('Orbium metadata must immediately contain a JSON object.');
        }
        $delimiters = [];
        $inString = false;
        $escaped = false;
        for ($index = 0, $length = strlen($source); $index < $length; $index++) {
            $character = $source[$index];
            if ($inString) {
                if ($escaped) {
                    $escaped = false;
                } elseif ($character === '\\') {
                    $escaped = true;
                } elseif ($character === '"') {
                    $inString = false;
                }

                continue;
            }
            if ($character === '"') {
                $inString = true;
            } elseif ($character === '{' || $character === '[') {
                $delimiters[] = $character;
                if (count($delimiters) > MarkdownContract::MAX_DEPTH) {
                    MarkdownContract::invalid('Orbium metadata is nested too deeply.');
                }
            } elseif ($character === '}' || $character === ']') {
                $opener = array_pop($delimiters);
                if (($character === '}' && $opener !== '{') || ($character === ']' && $opener !== '[')) {
                    MarkdownContract::invalid('Mismatched Orbium JSON delimiters.');
                }
                if ($delimiters === []) {
                    return $index + 1;
                }
            }
        }
        MarkdownContract::invalid('Orbium metadata has an unclosed JSON object.');
    }

    /** @return array<string, mixed> */
    public function decode(string $json, bool $inline = false): array
    {
        if ($this->objectLength($json) !== strlen($json)) {
            MarkdownContract::invalid('Unexpected text after Orbium metadata.');
        }
        try {
            $metadata = json_decode($json, true, MarkdownContract::MAX_DEPTH + 2, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            MarkdownContract::invalid('Orbium metadata contains invalid JSON or Unicode.');
        }
        if (! is_array($metadata)) {
            MarkdownContract::invalid('Orbium metadata must be an object.');
        }
        $this->rejectDuplicateKeys($json);
        $kind = $inline ? 'inline' : ($metadata['kind'] ?? null);
        $allowed = match ($kind) {
            'inline' => ['color', 'underline'],
            'block' => ['kind', 'dir', 'align', 'listType'],
            'image' => ['kind', 'caption', 'width', 'alignment'],
            'empty' => ['kind', 'dir', 'align'],
            'math' => ['kind', 'latex'],
            'code', 'table', 'row' => ['kind'],
            'cell' => ['kind', 'align', 'header', 'colspan', 'rowspan', 'colwidth'],
            default => MarkdownContract::invalid('Unknown Orbium directive kind.'),
        };
        foreach ($metadata as $key => $value) {
            if (! in_array($key, $allowed, true) || $value === null) {
                MarkdownContract::invalid('Orbium metadata contains an unknown key or null value.');
            }
            $valid = match ($key) {
                'kind' => is_string($value),
                'dir' => in_array($value, ['auto', 'ltr', 'rtl'], true),
                'align' => in_array($value, ['left', 'center', 'right'], true),
                'alignment' => in_array($value, ['start', 'left', 'center', 'right'], true),
                'listType' => in_array($value, ['1', 'a', 'A', 'i', 'I'], true),
                'width', 'colspan', 'rowspan' => is_int($value) && $value > 0 && $value <= 2147483647,
                'header' => is_bool($value),
                'underline' => $value === true,
                'color' => $this->isColor($value),
                'caption', 'latex' => is_string($value),
                'colwidth' => is_array($value) && array_is_list($value) && $value !== []
                    && count(array_filter($value, static fn ($width): bool => ! is_int($width) || $width < 0 || $width > 2147483647)) === 0,
            };
            if (! $valid) {
                MarkdownContract::invalid("Invalid Orbium metadata value for {$key}.");
            }
        }
        if ($kind === 'inline' && $metadata === []) {
            MarkdownContract::invalid('An Orbium formatting span needs color or underline.');
        }
        if ($kind === 'math' && ! array_key_exists('latex', $metadata)) {
            MarkdownContract::invalid('A math directive needs a latex string.');
        }
        if (isset($metadata['colwidth']) && count($metadata['colwidth']) !== ($metadata['colspan'] ?? 1)) {
            MarkdownContract::invalid('Cell colwidth length must equal colspan.');
        }

        return $metadata;
    }

    private function isColor(mixed $color): bool
    {
        return is_string($color) && (preg_match('/^#[0-9a-f]{6}$/D', $color) === 1
            || in_array($color, ['preset:charcoal', 'preset:gray', 'preset:red', 'preset:orange', 'preset:amber', 'preset:green', 'preset:teal', 'preset:blue', 'preset:purple', 'preset:pink'], true));
    }

    private function rejectDuplicateKeys(string $json): void
    {
        $keys = [];
        $depth = 0;
        for ($index = 0, $length = strlen($json); $index < $length; $index++) {
            $character = $json[$index];
            if ($character === '{' || $character === '[') {
                $depth++;
            } elseif ($character === '}' || $character === ']') {
                $depth--;
            } elseif ($character === '"') {
                $start = $index++;
                while ($index < $length && $json[$index] !== '"') {
                    if ($json[$index] === '\\') {
                        $index++;
                    }
                    $index++;
                }
                if ($depth === 1 && str_starts_with(ltrim(substr($json, $index + 1)), ':')) {
                    $key = json_decode(substr($json, $start, $index - $start + 1), true, 2, JSON_THROW_ON_ERROR);
                    if (isset($keys[$key])) {
                        MarkdownContract::invalid('Duplicate Orbium metadata keys are not allowed.');
                    }
                    $keys[$key] = true;
                }
            }
        }
    }
}
