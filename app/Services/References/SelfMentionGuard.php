<?php

namespace App\Services\References;

use App\Models\Node;
use App\Services\Markdown\MarkdownDocumentInspector;
use Illuminate\Validation\ValidationException;

final class SelfMentionGuard
{
    public function rejectSelfTarget(Node $source, int $targetId, string $field): void
    {
        if ($source->id === $targetId) {
            throw ValidationException::withMessages([$field => 'A page cannot mention itself. Choose another page.']);
        }
    }

    public function validateBoardLinks(Node $source, array $value): void
    {
        //
        // Native Board mentions use safe-link marks, so validate their canonical page URL rather than a Document mention index.
        //
        if (($value['type'] ?? null) === 'link' && is_string($value['attrs']['href'] ?? null)) {
            $path = parse_url($value['attrs']['href'], PHP_URL_PATH);
            if (is_string($path) && preg_match('~^/workspaces/([1-9][0-9]*)/(?:nodes|documents|databases|boards)/([1-9][0-9]*)/?$~D', rawurldecode($path), $match)
                && (int) $match[1] === $source->workspace_id) {
                $this->rejectSelfTarget($source, (int) $match[2], 'objects');
            }
        }
        if (is_string($value['table_source'] ?? null)) {
            $inspection = app(MarkdownDocumentInspector::class)->inspect($value['table_source']);
            foreach (array_keys($inspection->derived->mentions) as $targetId) {
                $this->rejectSelfTarget($source, (int) $targetId, 'objects');
            }
        }
        foreach ($value as $child) {
            if (is_array($child)) {
                $this->validateBoardLinks($source, $child);
            }
        }
    }
}
