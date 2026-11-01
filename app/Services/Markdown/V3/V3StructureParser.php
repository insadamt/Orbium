<?php

/**
 * Summary: Derives explicit V3 structure with a fresh scanner for each parse; depends on the shared contract and scope/fence-aware scanner.
 */

namespace App\Services\Markdown\V3;

final class V3StructureParser
{
    public function parse(string $source): V3Structure
    {
        return (new V3StructureScanner($source, new V3Contract))->scan();
    }
}
