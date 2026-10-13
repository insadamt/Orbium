<?php

namespace App\Services\DocumentTransfer;

use App\Services\Markdown\MarkdownAstSnapshot;
use App\Services\Markdown\MarkdownNodeSnapshot;
use App\Services\Markdown\MarkdownParserService;
use Illuminate\Validation\ValidationException;

final class DocumentPackageContent
{
    /**
     * @param  array<string, mixed>  $document
     * @param  list<array<string, mixed>>  $documents
     */
    public function validate(array $document, string $body, array $documents, int $version): void
    {
        $native = str_ends_with($document['path'], '.orbie');
        if ($native) {
            if (! preg_match('/^<!-- orbium-document (.+) -->\n/', $body, $match)) {
                $this->invalid('An Orbium document header is missing.');
            }
            try {
                $header = json_decode($match[1], true, 8, JSON_THROW_ON_ERROR);
            } catch (\Throwable) {
                $this->invalid('An Orbium document header is invalid.');
            }
            if (! is_array($header) || ($header['version'] ?? null) !== $version || ($header['title'] ?? null) !== $document['title']) {
                $this->invalid('An Orbium document header does not match the package.');
            }
            $body = substr($body, strlen($match[0]));
        }
        $parser = app(MarkdownParserService::class);
        $snapshots = app(MarkdownAstSnapshot::class);
        $canonical = $snapshots->capture($parser->parse($document['source']));
        $expected = [];
        foreach ($canonical as $record) {
            $destination = $record->destination;
            if (! $native && $destination !== null && preg_match('~^orbium:(node|attachment)/([1-9][0-9]*)$~D', $destination, $match)) {
                if ($match[1] === 'attachment') {
                    $destination = '../assets/'.$match[2];
                } else {
                    $target = array_find($documents, fn ($row) => $row['id'] === (int) $match[2]);
                    if ($target === null) {
                        $this->invalid('A package document reference is missing.');
                    }
                    $destination = basename($target['path']);
                }
            }
            $expected[] = new MarkdownNodeSnapshot($record->structure, $destination);
        }
        if ($snapshots->capture($parser->parse($body)) != $expected) {
            $this->invalid('The document contents do not match the package reference metadata.');
        }
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }
}
