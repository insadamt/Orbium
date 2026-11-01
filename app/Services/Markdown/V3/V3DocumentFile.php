<?php

/**
 * Summary: Reads/writes native V3 envelopes while retaining validated body bytes after LF/BOM normalization; depends on the isolated V3 contract/parser and never saves a Document.
 */

namespace App\Services\Markdown\V3;

use InvalidArgumentException;

final class V3DocumentFile
{
    public function __construct(private readonly V3Contract $contract, private readonly V3StructureParser $parser) {}

    public function decode(string $file): V3DocumentFileData
    {
        $normalized = str_replace(["\r\n", "\r"], "\n", str_starts_with($file, "\xEF\xBB\xBF") ? substr($file, 3) : $file);
        $newline = strpos($normalized, "\n");
        if ($newline === false || $newline > V3Contract::definition()['limits']['lineBytes']) {
            throw new InvalidArgumentException('A native V3 document needs a bounded format header followed by a newline.');
        }
        if (! preg_match('/^<!-- orbium-document (\{.*\}) -->$/D', substr($normalized, 0, $newline), $match)) {
            throw new InvalidArgumentException('The native V3 document envelope is missing or malformed.');
        }
        $metadata = $this->contract->decodeObject($match[1]);
        $this->contract->requireKeys($metadata, ['version', 'title']);
        if (! in_array($metadata['version'], [V3Contract::definition()['fileVersion'], (float) V3Contract::definition()['fileVersion']], true)) {
            throw new InvalidArgumentException('This file is not a supported V3 document. Historical development files are not converted.');
        }
        $this->validateTitle($metadata['title']);
        $source = substr($normalized, $newline + 1);

        return new V3DocumentFileData($metadata['title'], $source, $this->parser->parse($source)->requireValid());
    }

    public function encode(string $title, string $source): string
    {
        $this->validateTitle($title);
        $this->parser->parse($source)->requireValid();
        $metadata = ['version' => V3Contract::definition()['fileVersion'], 'title' => $title];

        return '<!-- orbium-document '.json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)." -->\n".$source;
    }

    private function validateTitle(mixed $title): void
    {
        if (! is_string($title) || ! mb_check_encoding($title, 'UTF-8') || mb_strlen($title, 'UTF-8') > 255
            || ! preg_match('/[^\x{0009}-\x{000d}\x{0020}\x{00a0}\x{1680}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}\x{feff}]/u', $title)
            || strpbrk($title, "\0\r\n") !== false) {
            throw new InvalidArgumentException('The document title must contain 1–255 Unicode characters without line breaks or NUL bytes.');
        }
    }
}
