<?php

namespace App\Services\MindMaps;

use App\Services\Boards\BoardBlockData;
use Illuminate\Validation\ValidationException;

final class MindMapTopicDocument
{
    private const BLOCKS = ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'callout', 'codeBlock'];

    public function validate(mixed $document, string $text, string $field): void
    {
        $count = 0;
        $plainText = $this->readNode($document, ['doc'], 0, $count, $field);
        if ($plainText !== $text) {
            $this->reject($field);
        }
    }

    private function readNode(mixed $node, array $allowed, int $depth, int &$count, string $field): string
    {
        if (! is_array($node) || ++$count > 256 || $depth > 16 || array_diff(array_keys($node), ['type', 'attrs', 'content']) !== [] || ! in_array($node['type'] ?? null, $allowed, true)) {
            $this->reject($field);
        }
        $type = $node['type'];
        $attrs = $node['attrs'] ?? [];
        $attribute = ['heading' => 'level', 'orderedList' => 'start', 'taskItem' => 'checked', 'codeBlock' => 'language'][$type] ?? null;
        if (! is_array($attrs) || array_diff(array_keys($attrs), $attribute === null ? [] : [$attribute]) !== []) {
            $this->reject($field);
        }
        if (($type === 'heading' && ! in_array($attrs['level'] ?? null, [1, 2, 3], true)) || ($type === 'orderedList' && (! is_int($attrs['start'] ?? null) || $attrs['start'] < 1 || $attrs['start'] > 999999)) || ($type === 'taskItem' && ! is_bool($attrs['checked'] ?? null)) || ($type === 'codeBlock' && ! in_array($attrs['language'] ?? null, [null, 'plaintext'], true))) {
            $this->reject($field);
        }
        $content = $node['content'] ?? [];
        if (! is_array($content) || ! array_is_list($content)) {
            $this->reject($field);
        }
        if (in_array($type, ['paragraph', 'heading', 'codeBlock'], true)) {
            (new BoardBlockData)->validate('text', ['content' => $content]);
            $text = '';
            foreach ($content as $inline) {
                if (($inline['type'] === 'hardBreak' && array_keys($inline) !== ['type']) || ($type === 'codeBlock' && ($inline['type'] !== 'text' || ! empty($inline['marks'])))) {
                    $this->reject($field);
                }
                $text .= $inline['type'] === 'hardBreak' ? "\n" : $inline['text'];
            }

            return $text;
        }
        $children = match ($type) {
            'bulletList', 'orderedList' => ['listItem'],
            'taskList' => ['taskItem'],
            default => self::BLOCKS,
        };
        if ($content === [] || (in_array($type, ['listItem', 'taskItem'], true) && ($content[0]['type'] ?? null) !== 'paragraph')) {
            $this->reject($field);
        }
        $parts = [];
        foreach ($content as $child) {
            $parts[] = $this->readNode($child, $children, $depth + 1, $count, $field);
        }

        return implode("\n", $parts);
    }

    private function reject(string $field): never
    {
        throw ValidationException::withMessages([$field => 'Invalid Mind Map topic document. Use supported text blocks within the topic limits.']);
    }
}
