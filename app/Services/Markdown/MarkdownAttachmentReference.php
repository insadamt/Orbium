<?php

namespace App\Services\Markdown;

final readonly class MarkdownAttachmentReference
{
    public function __construct(public int $id, public bool $isImage, public ?int $sourceLine) {}
}
