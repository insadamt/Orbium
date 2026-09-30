<?php

namespace App\Services\Search;

final readonly class SearchQuery
{
    public function __construct(
        public string $text,
        public ?string $type,
        public ?string $tag,
        public ?string $container,
        public ?int $parentId,
        public array $recentIds,
    ) {}

    public static function parse(array $input): self
    {
        $filters = [];
        $text = preg_replace_callback('/(?:^|\s)(type:|in:|#)("[^"]+"|\S+)/u', function ($match) use (&$filters) {
            $filters[$match[1]] = trim($match[2], '"');

            return ' ';
        }, $input['q'] ?? '');

        return new self(
            trim($text),
            ['doc' => 'document', 'folder' => 'folder', 'db' => 'database'][$filters['type:'] ?? ''] ?? null,
            $filters['#'] ?? null,
            $filters['in:'] ?? null,
            $input['parent_id'] ?? null,
            array_map('intval', $input['recent'] ?? []),
        );
    }
}
