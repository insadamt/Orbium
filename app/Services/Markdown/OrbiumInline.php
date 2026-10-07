<?php

namespace App\Services\Markdown;

use League\CommonMark\Node\Inline\AbstractInline;

final class OrbiumInline extends AbstractInline
{
    /** @param array<string, mixed> $metadata */
    public function __construct(public readonly array $metadata, public readonly ?string $latex = null)
    {
        parent::__construct();
    }
}
