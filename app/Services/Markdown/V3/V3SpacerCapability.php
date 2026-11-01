<?php

/**
 * Summary: Detects actual V3 spacer identities for stale-client save protection without matching literal code examples; depends on the bounded structural parser.
 */

namespace App\Services\Markdown\V3;

final class V3SpacerCapability
{
    public function containsSpacers(string $source): bool
    {
        $structure = (new V3StructureParser)->parse($source);

        return array_any($structure->blocks, fn ($block) => $block['type'] === 'spacer');
    }
}
