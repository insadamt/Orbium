<?php

namespace App\Services\Editor;

use Illuminate\Validation\ValidationException;

class EditorContentInspector
{
    private const NODE_TYPES = ['doc', 'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'taskList', 'taskItem', 'blockquote', 'horizontalRule', 'codeBlock', 'hardBreak', 'text', 'table', 'tableRow', 'tableCell', 'tableHeader', 'image', 'file', 'mention', 'callout', 'mermaid', 'blockMath', 'inlineMath'];

    private const MARK_TYPES = ['bold', 'italic', 'strike', 'underline', 'code', 'link', 'textColor'];

    /** @param array<string, mixed> $content */
    public function validateContentShape(array $content): void
    {
        if (($content['type'] ?? null) !== 'doc') {
            $this->invalid('The editor content must start with a document.');
        }

        $this->walk($content, 0, function (array $node): void {
            $type = $node['type'] ?? null;
            if (! is_string($type) || ! in_array($type, self::NODE_TYPES, true)) {
                $this->invalid('The document contains an unsupported block.');
            }
            if (isset($node['text']) && (! is_string($node['text']) || mb_strlen($node['text']) > 100000)) {
                $this->invalid('A text block is too large or invalid.');
            }
            if ($type === 'text' && ! is_string($node['text'] ?? null)) {
                $this->invalid('A text block is missing its text.');
            }
            if (isset($node['attrs']) && ! is_array($node['attrs'])) {
                $this->invalid('A block has invalid attributes.');
            }
            $attrs = $node['attrs'] ?? [];
            if (isset($attrs['dir']) && ! in_array($attrs['dir'], ['ltr', 'rtl', 'auto'], true)) {
                $this->invalid('A block direction is invalid.');
            }
            if (isset($attrs['directionMode']) && (! in_array($type, ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'callout', 'table'], true) || ! in_array($attrs['directionMode'], ['auto', 'manual'], true))) {
                $this->invalid('A block direction mode is invalid.');
            }
            if (isset($attrs['textAlign']) && (! in_array($type, ['paragraph', 'heading'], true) || ! in_array($attrs['textAlign'], ['left', 'center', 'right'], true))) {
                $this->invalid('A block alignment is invalid.');
            }
            if ($type === 'mention' && ! filter_var($attrs['id'] ?? null, FILTER_VALIDATE_INT)) {
                $this->invalid('A mention has no target.');
            }
            if (in_array($type, ['image', 'file'], true) && ! filter_var($attrs['attachmentId'] ?? null, FILTER_VALIDATE_INT)) {
                $this->invalid('A file block has no attachment.');
            }
            if ($type === 'heading' && ! in_array($attrs['level'] ?? null, [1, 2, 3], true)) {
                $this->invalid('A heading level is invalid.');
            }
            if (isset($node['marks']) && ! is_array($node['marks'])) {
                $this->invalid('A block has invalid formatting.');
            }
            foreach ($node['marks'] ?? [] as $mark) {
                if (! is_array($mark) || ! in_array($mark['type'] ?? null, self::MARK_TYPES, true)) {
                    $this->invalid('The document contains unsupported formatting.');
                }
                if (isset($mark['attrs']) && ! is_array($mark['attrs'])) {
                    $this->invalid('A link has invalid attributes.');
                }
                if ($mark['type'] === 'link' && ! $this->isSafeUrl($mark['attrs']['href'] ?? null)) {
                    $this->invalid('A link has an unsafe URL.');
                }
                if ($mark['type'] === 'textColor' && (! is_string($mark['attrs']['color'] ?? null) || ! preg_match('/^#[0-9a-fA-F]{6}$/', $mark['attrs']['color']))) {
                    $this->invalid('A text color is invalid.');
                }
            }
        });
    }

    /** @param array<string, mixed> $content */
    public function extractPlainText(array $content): string
    {
        return trim($this->plainTextFromNode($content));
    }

    /** @param array<string, mixed> $content
     * @return array<int, string>
     */
    public function extractMentions(array $content): array
    {
        $mentions = [];
        $this->walk($content, 0, static function (array $node) use (&$mentions): void {
            if (($node['type'] ?? null) === 'mention') {
                $mentions[(int) $node['attrs']['id']] = (string) ($node['attrs']['label'] ?? '');
            }
        });

        return $mentions;
    }

    /** @param array<string, mixed> $content
     * @return array<int, int>
     */
    public function extractAttachmentIds(array $content): array
    {
        $ids = [];
        $this->walk($content, 0, static function (array $node) use (&$ids): void {
            if (in_array($node['type'] ?? null, ['image', 'file'], true)) {
                $ids[] = (int) $node['attrs']['attachmentId'];
            }
        });

        return array_values(array_unique($ids));
    }

    /** @param array<string, mixed> $content
     * @param  array<int, int>  $nodeIds
     * @param  array<int, int>  $attachmentIds
     * @return array<string, mixed>
     */
    public function remapReferences(array $content, array $nodeIds, array $attachmentIds): array
    {
        $this->validateContentShape($content);

        return $this->remapNode($content, $nodeIds, $attachmentIds);
    }

    /** @param array<string, mixed> $content
     * @param  array<int, int>  $nodeIds
     * @param  array<int, int>  $attachmentIds
     * @return array<string, mixed>
     */
    private function remapNode(array $content, array $nodeIds, array $attachmentIds): array
    {
        if (($content['type'] ?? null) === 'mention') {
            $oldId = (int) $content['attrs']['id'];
            if (! isset($nodeIds[$oldId])) {
                $this->invalid('A mention cannot be remapped.');
            }
            $content['attrs']['id'] = $nodeIds[$oldId];
        }
        if (in_array($content['type'] ?? null, ['image', 'file'], true)) {
            $oldId = (int) $content['attrs']['attachmentId'];
            if (! isset($attachmentIds[$oldId])) {
                $this->invalid('A file cannot be remapped.');
            }
            $content['attrs']['attachmentId'] = $attachmentIds[$oldId];
        }
        foreach ($content['content'] ?? [] as $index => $child) {
            $content['content'][$index] = $this->remapNode($child, $nodeIds, $attachmentIds);
        }

        return $content;
    }

    private function isSafeUrl(mixed $url): bool
    {
        return is_string($url) && (str_starts_with(strtolower($url), 'https://') || str_starts_with(strtolower($url), 'http://') || str_starts_with(strtolower($url), 'mailto:'));
    }

    /** @param array<string, mixed> $node */
    private function plainTextFromNode(array $node): string
    {
        $type = $node['type'] ?? null;
        if ($type === 'text') {
            return $node['text'];
        }
        if ($type === 'mention') {
            return '@'.($node['attrs']['label'] ?? '');
        }
        if (in_array($type, ['blockMath', 'inlineMath'], true)) {
            return (string) ($node['attrs']['latex'] ?? '');
        }
        if ($type === 'mermaid') {
            return (string) ($node['attrs']['source'] ?? '');
        }
        $parts = array_map(fn (array $child): string => $this->plainTextFromNode($child), $node['content'] ?? []);
        $separator = in_array($type, ['doc', 'bulletList', 'orderedList', 'taskList', 'table', 'tableRow'], true) ? "\n" : '';

        return implode($separator, $parts);
    }

    /** @param array<string, mixed> $node */
    private function walk(array $node, int $depth, callable $visit): void
    {
        if ($depth > 32) {
            $this->invalid('The document is nested too deeply.');
        }
        $visit($node);
        $children = $node['content'] ?? [];
        if (! is_array($children) || count($children) > 5000) {
            $this->invalid('The document has invalid blocks.');
        }
        foreach ($children as $child) {
            if (! is_array($child)) {
                $this->invalid('The document has invalid blocks.');
            }
            $this->walk($child, $depth + 1, $visit);
        }
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['content' => $message]);
    }
}
