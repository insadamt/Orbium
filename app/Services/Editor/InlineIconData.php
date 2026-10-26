<?php

namespace App\Services\Editor;

use App\Models\Attachment;
use App\Models\Node;
use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\OrbiumInline;
use Illuminate\Validation\ValidationException;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Node\Inline\Text;

final class InlineIconData
{
    private static ?array $builtinIcons = null;

    public function markdownHasIcons(string $source): bool
    {
        if (! str_contains($source, ':orbium[')) {
            return false;
        }
        $walker = app(MarkdownParserService::class)->parse($source)->walker();
        while ($event = $walker->next()) {
            $node = $event->getNode();
            if ($event->isEntering() && $node instanceof OrbiumInline && isset($node->metadata['icon'])) {
                return true;
            }
        }

        return false;
    }

    public function validateAttachments(Node $source, array $content): void
    {
        $ids = [];
        $pending = [$content];
        while ($pending !== []) {
            $node = array_pop($pending);
            if (($node['type'] ?? null) === 'inlineIcon' && ($node['attrs']['kind'] ?? null) === 'custom') {
                $ids[] = $node['attrs']['attachmentId'];
            }
            array_push($pending, ...($node['content'] ?? []));
        }
        $ids = array_unique($ids);
        if ($ids !== [] && Attachment::query()->where('workspace_id', $source->workspace_id)
            ->whereIn('id', $ids)->where('purpose', 'image')
            ->whereIn('mime_type', ['image/png', 'image/jpeg', 'image/gif', 'image/webp'])->count() !== count($ids)) {
            $this->invalid();
        }
    }

    public function isBuiltin(mixed $name): bool
    {
        //
        // Both renderers and server validation use one allowlist so saved names cannot drift.
        //
        self::$builtinIcons ??= json_decode(file_get_contents(resource_path('js/components/inline-icons/data/icons.json')), true, flags: JSON_THROW_ON_ERROR);

        return is_string($name) && array_key_exists($name, self::$builtinIcons);
    }

    public function validateAttributes(mixed $attributes): void
    {
        if (! is_array($attributes) || ($attributes['version'] ?? null) !== 1
            || ! in_array($attributes['kind'] ?? null, ['builtin', 'custom'], true)
            || ! is_string($attributes['label'] ?? null) || trim($attributes['label']) === ''
            || mb_strlen($attributes['label']) > 160 || preg_match('/[\x00-\x1f\x7f]/', $attributes['label'])) {
            $this->invalid();
        }
        if ($attributes['kind'] === 'builtin') {
            if (! $this->isBuiltin($attributes['name'] ?? null) || ($attributes['attachmentId'] ?? null) !== null) {
                $this->invalid();
            }
        } elseif (! is_int($attributes['attachmentId'] ?? null) || $attributes['attachmentId'] < 1 || ($attributes['name'] ?? null) !== null) {
            $this->invalid();
        }
    }

    public function validateMarkdownSpan(OrbiumInline $span): void
    {
        if (! isset($span->metadata['icon'])) {
            return;
        }
        $children = iterator_to_array($span->children(), false);
        if ($span->metadata['icon'] === 'custom') {
            if (count($children) !== 1 || ! $children[0] instanceof Image
                || ! preg_match('~^(?:orbium:attachment/[1-9][0-9]*|#orbium-missing-image-[1-9][0-9]*)$~D', $children[0]->getUrl())) {
                MarkdownContract::invalid('A custom inline icon must wrap one workspace image reference.');
            }
        } elseif ($children === [] || count(array_filter($children, static fn ($child) => ! $child instanceof Text)) > 0) {
            MarkdownContract::invalid('A built-in inline icon must contain a plain text label.');
        }
    }

    private function invalid(): never
    {
        throw ValidationException::withMessages(['content' => 'An inline icon has invalid version, source, or label. Reload Orbium if it was created by a newer editor.']);
    }
}
