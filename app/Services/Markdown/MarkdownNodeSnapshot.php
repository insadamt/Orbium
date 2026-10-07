<?php

namespace App\Services\Markdown;

final readonly class MarkdownNodeSnapshot
{
    public function __construct(public string $structure, public ?string $destination) {}
}
