<?php

namespace App\Services\MindMaps;

use Illuminate\Validation\ValidationException;

final class MindMapIconReferences
{
    public function attachmentIds(array $map): array
    {
        $ids = [];
        foreach ($map['topics'] as $topic) {
            $this->visit($topic['body'] ?? [], function (array $node) use (&$ids): array {
                if (($node['type'] ?? null) === 'inlineIcon' && ($node['attrs']['kind'] ?? null) === 'custom') {
                    $ids[] = $node['attrs']['attachmentId'];
                }

                return $node;
            });
        }

        return array_values(array_unique($ids));
    }

    public function remap(array $map, array $attachmentIds): array
    {
        foreach ($map['topics'] as &$topic) {
            if (! isset($topic['body'])) {
                continue;
            }
            $topic['body'] = $this->visit($topic['body'], function (array $node) use ($attachmentIds): array {
                if (($node['type'] ?? null) === 'inlineIcon' && ($node['attrs']['kind'] ?? null) === 'custom') {
                    $replacement = $attachmentIds[$node['attrs']['attachmentId']] ?? null;
                    if (! is_int($replacement) || $replacement < 1) {
                        throw ValidationException::withMessages(['content' => 'A Mind Map icon is missing an attachment remapping ID.']);
                    }
                    $node['attrs']['attachmentId'] = $replacement;
                }

                return $node;
            });
        }

        return $map;
    }

    public function replaceOmittedIconsWithLabels(array $map, array $omittedIds): array
    {
        foreach ($map['topics'] as &$topic) {
            if (! isset($topic['body'])) {
                continue;
            }
            $topic['body'] = $this->visit($topic['body'], static function (array $node) use ($omittedIds): array {
                if (($node['type'] ?? null) !== 'inlineIcon' || ($node['attrs']['kind'] ?? null) !== 'custom' || ! in_array($node['attrs']['attachmentId'], $omittedIds, true)) {
                    return $node;
                }

                //
                // Standalone files cannot carry assets; keep the label without a stale ID that could target another image.
                //
                return ['type' => 'text', 'text' => $node['attrs']['label'], ...isset($node['marks']) ? ['marks' => $node['marks']] : []];
            });
        }

        return $map;
    }

    private function visit(array $node, callable $callback): array
    {
        $node = $callback($node);
        foreach ($node['content'] ?? [] as $index => $child) {
            $node['content'][$index] = $this->visit($child, $callback);
        }

        return $node;
    }
}
