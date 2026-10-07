<?php

namespace App\Services\Markdown;

use League\CommonMark\Node\Block\AbstractBlock;

final class OrbiumBlock extends AbstractBlock
{
    /** @param array<string, mixed> $metadata */
    public function __construct(public readonly array $metadata, public readonly int $fenceLength)
    {
        parent::__construct();
    }

    public function kind(): string
    {
        return (string) $this->metadata['kind'];
    }
}
