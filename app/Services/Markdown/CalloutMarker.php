<?php

namespace App\Services\Markdown;

use League\CommonMark\Node\Inline\AbstractInline;

final class CalloutMarker extends AbstractInline
{
    public function __construct(public readonly string $type, public readonly ?string $folding)
    {
        parent::__construct();
    }
}
