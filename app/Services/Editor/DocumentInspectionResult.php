<?php

namespace App\Services\Editor;

final readonly class DocumentInspectionResult
{
    /**
     * @param  array<int, string>  $mentions
     * @param  array<int, int>  $attachmentIds
     * @param  array<string, string>  $mermaidSourcesByHash
     */
    public function __construct(
        public array $mentions,
        public array $attachmentIds,
        public string $plainText,
        public array $mermaidSourcesByHash,
    ) {}
}
