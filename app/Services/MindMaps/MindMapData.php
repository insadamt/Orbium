<?php

namespace App\Services\MindMaps;

use App\Services\Boards\BoardBlockData;
use App\Services\Editor\InlineIconData;
use Illuminate\Validation\ValidationException;

final class MindMapData
{
    public const MAX_BYTES = 65536;

    public function validate(mixed $value, string $field = 'mindmap'): array
    {
        $invalid = static fn () => throw ValidationException::withMessages([$field => 'Invalid Mind Map. Use a connected supported topic tree, labels up to 500 characters, depth up to 64 and at most 64 KiB.']);
        if (! is_array($value) || array_diff(array_keys($value), ['version', 'root_id', 'topics', ...(($value['version'] ?? 0) >= 5 ? ['layout'] : [])]) !== [] || ! in_array($value['version'] ?? null, [1, 2, 3, 4, 5, 6, 7], true) || ! $this->identifier($value['root_id'] ?? null) || ! is_array($value['topics'] ?? null) || ! array_is_list($value['topics']) || $value['topics'] === []) {
            $invalid();
        }
        if (array_key_exists('layout', $value) && ! in_array($value['layout'], ['balanced', 'tree-right', 'tree-left', 'hierarchy-down', 'hierarchy-up', 'outline', 'brace', 'fishbone', 'timeline', 'timeline-vertical'], true)) {
            $invalid();
        }
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false || strlen($encoded) > self::MAX_BYTES) {
            $invalid();
        }
        $topics = [];
        foreach ($value['topics'] as $topic) {
            if (! is_array($topic) || array_diff(array_keys($topic), ['id', 'parent_id', 'text', 'collapsed', ...($value['version'] >= 2 ? ['content'] : []), ...($value['version'] >= 3 ? ['width'] : []), ...($value['version'] >= 4 ? ['body'] : []), ...($value['version'] >= 6 ? ['color', 'icon'] : [])]) !== [] || ! $this->identifier($topic['id'] ?? null) || isset($topics[$topic['id']]) || ! array_key_exists('parent_id', $topic) || ($topic['parent_id'] !== null && ! $this->identifier($topic['parent_id'])) || ! is_string($topic['text'] ?? null) || mb_strlen($topic['text']) > 500 || ! mb_check_encoding($topic['text'], 'UTF-8') || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u', $topic['text']) || ! is_bool($topic['collapsed'] ?? null)) {
                $invalid();
            }
            if ((array_key_exists('color', $topic) && ! in_array($topic['color'], ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'], true)) || (array_key_exists('icon', $topic) && ! (new InlineIconData)->isBuiltin($topic['icon']))) {
                $invalid();
            }
            if (array_key_exists('width', $topic) && (! is_int($topic['width']) || $topic['width'] < 100 || $topic['width'] > 800)) {
                $invalid();
            }
            if (array_key_exists('body', $topic)) {
                if (array_key_exists('content', $topic)) {
                    $invalid();
                }
                (new MindMapTopicDocument)->validate($topic['body'], $topic['text'], $field, $value['version'] >= 7);
            }
            if (array_key_exists('content', $topic)) {
                $content = $topic['content'];
                (new BoardBlockData)->validate('text', ['content' => $content]);
                $plainText = '';
                foreach ($content as $inline) {
                    if ($inline['type'] === 'hardBreak' && array_keys($inline) !== ['type']) {
                        $invalid();
                    }
                    $plainText .= $inline['type'] === 'hardBreak' ? "\n" : $inline['text'];
                }
                if ($plainText !== $topic['text']) {
                    $invalid();
                }
            }
            $topics[$topic['id']] = $topic;
        }
        if (! isset($topics[$value['root_id']]) || $topics[$value['root_id']]['parent_id'] !== null) {
            $invalid();
        }
        foreach ($topics as $topic) {
            $seen = [];
            while ($topic['id'] !== $value['root_id']) {
                if (isset($seen[$topic['id']]) || count($seen) >= 64 || $topic['parent_id'] === null || ! isset($topics[$topic['parent_id']])) {
                    $invalid();
                }
                $seen[$topic['id']] = true;
                $topic = $topics[$topic['parent_id']];
            }
        }

        return $value;
    }

    public function text(array $map): string
    {
        return implode("\n", array_column($map['topics'], 'text'));
    }

    public function outline(array $map): string
    {
        $children = [];
        $topics = [];
        foreach ($map['topics'] as $topic) {
            $topics[$topic['id']] = $topic;
            if ($topic['parent_id'] !== null) {
                $children[$topic['parent_id']][] = $topic;
            }
        }
        $lines = [];
        $visit = function (array $topic, int $depth) use (&$visit, &$lines, $children): void {
            $text = preg_replace('/[\r\n\t]+/u', ' ', $topic['text']);
            $lines[] = str_repeat('  ', $depth).'- '.$text;
            foreach ($children[$topic['id']] ?? [] as $child) {
                $visit($child, $depth + 1);
            }
        };
        $visit($topics[$map['root_id']], 0);

        return implode("\n", $lines);
    }

    private function identifier(mixed $value): bool
    {
        return is_string($value) && preg_match('/\A[a-zA-Z0-9_-]{1,64}\z/', $value) === 1;
    }
}
