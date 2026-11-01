<?php

/**
 * Summary: Verifies native V3 identity/source equality and canonical clean Markdown entries; depends on separate document/package versions and the safe export serializer.
 */

namespace App\Services\DocumentTransfer;

use App\Services\Markdown\MarkdownDocumentInspector;
use App\Services\Markdown\V3\V3DocumentFile;
use Illuminate\Validation\ValidationException;

final class DocumentPackageContent
{
    /**
     * @param  array<string, mixed>  $document
     * @param  list<array<string, mixed>>  $documents
     */
    public function validate(array $document, string $body, array $documents, int $version): void
    {
        //
        // The package manifest version and native document version are separate contracts.
        //
        $native = str_ends_with($document['path'], '.orbie');
        if ($native) {
            $decoded = app(V3DocumentFile::class)->decode($body);
            if ($decoded->title !== $document['title'] || $decoded->source !== $document['source']) {
                $this->invalid('The native document identities or content do not match the package.');
            }

            return;
        }
        $nodes = [];
        foreach ($documents as $row) {
            $nodes[$row['id']] = basename($row['path']);
        }
        $inspection = app(MarkdownDocumentInspector::class)->inspect($document['source']);
        $attachments = [];
        foreach ($inspection->derived->attachmentIds as $id) {
            $attachments[$id] = '../assets/'.$id;
        }
        $expected = app(DocumentMarkdownSerializer::class)->serialize($document['source'], new TransferSerializationOptions(false, $nodes, $attachments));
        if ($body !== $expected) {
            $this->invalid('The document contents do not match the package reference metadata.');
        }
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }
}
