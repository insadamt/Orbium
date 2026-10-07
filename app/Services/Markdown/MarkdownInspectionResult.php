<?php

namespace App\Services\Markdown;

use App\Services\Editor\DocumentInspectionResult;

final readonly class MarkdownInspectionResult
{
    /** @param list<MarkdownAttachmentReference> $attachmentReferences */
    public function __construct(
        public string $source,
        public DocumentInspectionResult $derived,
        public array $attachmentReferences,
    ) {}
}
