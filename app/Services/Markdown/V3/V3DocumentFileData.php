<?php

/**
 * Summary: Carries validated native V3 title/source/structure together without confusing file and saved-format versions; depends on the shared V3 contract and scanner result.
 */

namespace App\Services\Markdown\V3;

final readonly class V3DocumentFileData
{
    public function __construct(public string $title, public string $source, public V3Structure $structure) {}
}
