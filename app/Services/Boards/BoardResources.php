<?php

namespace App\Services\Boards;

use App\Models\Node;
use App\Services\Markdown\MarkdownContract;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class BoardResources
{
    public function browse(Node $board, string $query, int $after): array
    {
        $rows = $this->summaryQuery($board)->where('nodes.id', '>', $after)
            ->where('nodes.type', 'document')
            ->when($query !== '', fn ($builder) => $builder->where('nodes.title', 'ilike', '%'.addcslashes($query, '%_\\').'%'))
            ->orderBy('nodes.id')->limit(41)->get();
        $more = $rows->count() > 40;
        $rows = $rows->take(40);

        return ['resources' => $rows->map($this->summary(...))->values()->all(), 'next' => $more ? $rows->last()->id : null];
    }

    public function previews(Node $board, array $ids): array
    {
        return $this->summaryQuery($board)->whereIn('nodes.id', $ids)->get()->map($this->summary(...))->values()->all();
    }

    private function summaryQuery(Node $board): Builder
    {
        // Visibility follows live containment, including database documents, without N+1 ancestry reads.

        return Node::query()->where('nodes.workspace_id', $board->workspace_id)->where('nodes.id', '!=', $board->id)
            ->whereIn('nodes.type', BoardResourceReferences::TYPES)
            ->whereRaw("nodes.id IN (WITH RECURSIVE live AS (
                SELECT id, parent_id, type, workspace_id, 0 AS depth FROM nodes WHERE workspace_id = ? AND deleted_at IS NULL AND parent_id IS NULL
                UNION ALL SELECT child.id, child.parent_id, child.type, child.workspace_id, live.depth + 1 FROM nodes child JOIN live ON child.parent_id = live.id
                WHERE child.workspace_id = live.workspace_id AND child.deleted_at IS NULL AND live.depth < 999 AND (live.type = 'folder' OR (live.type = 'database' AND child.type = 'document'))
            ) SELECT id FROM live)", [$board->workspace_id])
            ->leftJoin('documents', 'documents.node_id', '=', 'nodes.id')
            ->select(['nodes.id', 'nodes.workspace_id', 'nodes.parent_id', 'nodes.type', 'nodes.title', 'nodes.icon'])
            ->selectSub(DB::table('nodes as parent')->select('title')->whereColumn('parent.id', 'nodes.parent_id'), 'parent_title')
            ->selectRaw('COALESCE(documents.icon_attachment_id, nodes.icon_attachment_id) AS preview_icon_id, substring(documents.plain_text from 1 for 1200) AS excerpt, documents.revision AS document_revision');
    }

    private function summary(Node $node): array
    {
        $route = match ($node->type) {
            'document' => 'documents.show', 'database' => 'databases.show', default => 'boards.show',
        };
        $icon = $node->preview_icon_id;

        return [
            ...$node->only(['id', 'parent_id', 'type', 'title', 'icon']),
            'url' => route($route, [$node->workspace_id, $node->id], false), 'parent_title' => $node->parent_title,
            'icon_url' => $icon === null ? null : route('library.files.show', [$node->workspace_id, $icon], false),
            'excerpt' => $node->excerpt ?? '', 'revision' => $node->document_revision === null ? null : (int) $node->document_revision,
        ];
    }

    public function document(Node $target): array
    {
        abort_unless($target->type === 'document', 404);

        return DB::transaction(function () use ($target): array {
            $document = $target->document()->sharedLock()->firstOrFail();
            abort_unless(in_array($document->content_format_version, [1, 2], true), 409, 'This document requires a newer editor.');
            abort_if($document->content_format_version === 2 && ! is_string($document->markdown), 409, 'Document source is unavailable.');

            return [
                'id' => $target->id, 'title' => $target->title, 'parent_id' => $target->parent_id,
                'content_format_version' => $document->content_format_version, 'revision' => $document->revision,
                ...($document->content_format_version === 2
                    ? ['markdown' => $document->markdown, 'markdown_limits' => ['source_bytes' => MarkdownContract::MAX_SOURCE_BYTES, 'line_bytes' => MarkdownContract::MAX_LINE_BYTES]]
                    : ['content' => $document->content]),
            ];
        });
    }
}
