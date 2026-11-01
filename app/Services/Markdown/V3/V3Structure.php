<?php

/**
 * Summary: Carries a derived V3 source index and bounded diagnostics without replacing source authority; depends on the scanner's UTF-8 byte ranges, not CodeMirror UTF-16 coordinates.
 */

namespace App\Services\Markdown\V3;

use Illuminate\Validation\ValidationException;
use JsonSerializable;

final readonly class V3Structure implements JsonSerializable
{
    /**
     * @param  list<array<string, mixed>>  $blocks
     * @param  list<array<string, mixed>>  $columns
     * @param  list<array<string, mixed>>  $directives
     * @param  list<array<string, mixed>>  $diagnostics
     */
    public function __construct(
        public int $sourceLength,
        public array $blocks,
        public array $columns,
        public array $directives,
        public array $diagnostics,
    ) {}

    public function valid(): bool
    {
        return $this->diagnostics === [];
    }

    public function requireValid(): self
    {
        if (! $this->valid()) {
            throw ValidationException::withMessages(['markdown' => array_map(
                static fn (array $issue): string => $issue['message'].' (source line '.$issue['line'].')',
                $this->diagnostics,
            )]);
        }

        return $this;
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return ['offsetUnit' => 'utf-8-bytes', 'sourceBytes' => $this->sourceLength, ...get_object_vars($this)];
    }
}
