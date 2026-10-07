<?php

namespace App\Services\Markdown;

final readonly class MarkdownSaveData
{
    public function __construct(public string $markdown, public int $revision, public int $contentFormatVersion) {}
}
