<?php

namespace App\Services\Markdown;

use Illuminate\Validation\ValidationException;

final class MarkdownContract
{
    public const FORMAT_VERSION = 2;

    public const DIALECT = 'orbium-markdown-v1';

    public const MAX_SOURCE_BYTES = 2097152;

    public const MAX_LINE_BYTES = 131072;

    public const MAX_DEPTH = 32;

    public const MAX_NODES = 100000;

    public static function normalizeSource(string $source): string
    {
        if (strlen($source) > self::MAX_SOURCE_BYTES) {
            self::invalid('Markdown exceeds the 2 MiB source limit.');
        }
        if (! mb_check_encoding($source, 'UTF-8') || str_contains($source, "\0")) {
            self::invalid('Markdown must be UTF-8 text without NUL bytes.');
        }

        $source = str_replace(["\r\n", "\r"], "\n", $source);
        foreach (explode("\n", $source) as $index => $line) {
            if (strlen($line) > self::MAX_LINE_BYTES) {
                self::invalid('A Markdown source line exceeds the 128 KiB complexity limit.', $index + 1);
            }
        }

        return $source;
    }

    public static function invalid(string $message, ?int $line = null): never
    {
        $context = $line === null ? '' : " (source line {$line})";
        throw ValidationException::withMessages(['markdown' => $message.$context]);
    }
}
