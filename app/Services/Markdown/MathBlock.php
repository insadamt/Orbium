<?php

namespace App\Services\Markdown;

use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Node\StringContainerInterface;

final class MathBlock extends AbstractBlock implements StringContainerInterface
{
    private string $literal = '';

    public function setLiteral(string $literal): void
    {
        $this->literal = $literal;
    }

    public function getLiteral(): string
    {
        return $this->literal;
    }
}
