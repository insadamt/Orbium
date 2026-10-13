<?php

namespace App\Services\Library;

use App\Models\Attachment;
use App\Models\DatabaseProperty;
use App\Models\DatabaseValue;
use App\Models\Document;
use App\Models\Node;
use App\Models\Workspace;
use App\Services\Editor\EditorContentInspector;
use App\Services\Markdown\MarkdownDocumentInspector;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

final class LibraryCatalog
{
    public function files(Workspace $workspace, LibraryBrowseData $browse): array
    {
        $page = $this->filteredFiles($workspace, $browse)->paginate(48, ['*'], 'page', $browse->page);

        return ['files' => $page->getCollection()->map($this->summary(...))->all(), 'total' => $page->total(),
            'page' => $page->currentPage(), 'has_more' => $page->hasMorePages()];
    }

    public function summary(Attachment $file): array
    {
        $dimensions = app(LibraryImagePreview::class)->dimensions($file);

        return [
            'id' => $file->id, 'name' => $file->original_name, 'mime_type' => $file->mime_type,
            'size_bytes' => $file->size_bytes, 'created_at' => $file->created_at->toISOString(),
            'url' => route('library.files.show', [$file->workspace_id, $file]),
            'thumbnail_url' => route('library.files.thumbnail', [$file->workspace_id, $file]),
            'available' => Storage::disk('local')->exists($file->storage_key),
            'width' => $dimensions['width'] ?? null, 'height' => $dimensions['height'] ?? null,
        ];
    }

    public function details(Workspace $workspace, Attachment $file): array
    {
        $usage = $this->usage($workspace);

        return [...$this->summary($file), 'usage' => array_values($usage[$file->id] ?? [])];
    }

    public function neighbors(Workspace $workspace, Attachment $file, LibraryBrowseData $browse): array
    {
        $query = $this->filteredFiles($workspace, $browse);
        if (! (clone $query)->whereKey($file->id)->exists()) {
            return ['previous' => null, 'next' => null];
        }

        return ['previous' => $this->neighborId(clone $query, $file, $browse, true),
            'next' => $this->neighborId(clone $query, $file, $browse, false)];
    }

    private function neighborId(Builder $query, Attachment $file, LibraryBrowseData $browse, bool $previous): ?int
    {
        $ascending = $browse->sort === 'name';
        $operator = $previous === $ascending ? '<' : '>';
        $direction = $previous ? ($ascending ? 'desc' : 'asc') : ($ascending ? 'asc' : 'desc');
        [$column, $value] = match ($browse->sort) {
            'name' => ['LOWER(original_name)', $file->original_name],
            'size' => ['size_bytes', $file->size_bytes],
            default => ['created_at', $file->created_at],
        };
        $placeholder = $ascending ? 'LOWER(?)' : '?';

        return $query->where(function (Builder $query) use ($column, $value, $placeholder, $operator, $file): void {
            $query->whereRaw($column.' '.$operator.' '.$placeholder, [$value])
                ->orWhere(fn (Builder $query) => $query->whereRaw($column.' = '.$placeholder, [$value])->where('id', $operator, $file->id));
        })->reorder()->orderByRaw($column.' '.$direction)->orderBy('id', $direction)->value('id');
    }

    private function filteredFiles(Workspace $workspace, LibraryBrowseData $browse): Builder
    {
        $query = Attachment::query()->where('workspace_id', $workspace->id);
        if ($browse->query !== '') {
            $term = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower($browse->query));
            $query->whereRaw('LOWER(original_name) LIKE ?', ['%'.$term.'%']);
        }
        if ($browse->type === 'images') {
            $query->whereIn('mime_type', LibraryImagePreview::IMAGE_TYPES);
        } elseif ($browse->type === 'files') {
            $query->whereNotIn('mime_type', LibraryImagePreview::IMAGE_TYPES);
        }

        return match ($browse->sort) {
            'name' => $query->orderByRaw('LOWER(original_name)')->orderBy('id'),
            'size' => $query->orderByDesc('size_bytes')->orderByDesc('id'),
            default => $query->orderByDesc('created_at')->orderByDesc('id'),
        };
    }

    public function usage(Workspace $workspace): array
    {
        $usage = [];
        $nodes = Node::withTrashed()->where('workspace_id', $workspace->id)->get()->keyBy('id');
        $trashState = [];
        $add = function (?int $attachmentId, Node $node) use (&$usage, &$trashState, $nodes): void {
            if ($attachmentId === null) {
                return;
            }
            $inTrash = $trashState[$node->id] ??= $this->hasTrashedAncestry($node, $nodes);
            $usage[$attachmentId][$node->id] = [
                'id' => $node->id, 'title' => $node->title, 'trashed' => $inTrash,
                'url' => $inTrash ? '/trash?workspace='.$node->workspace_id : '/workspaces/'.$node->workspace_id.'/'.($node->type === 'document' ? 'documents' : ($node->type === 'database' ? 'databases' : 'nodes')).'/'.$node->id,
            ];
        };
        foreach ($nodes as $node) {
            $add($node->cover_attachment_id, $node);
            $add($node->icon_attachment_id, $node);
        }
        foreach (Document::query()->whereIn('node_id', $nodes->keys())->cursor() as $document) {
            $node = $nodes[$document->node_id];
            $add($document->cover_attachment_id, $node);
            $add($document->icon_attachment_id, $node);
            $ids = $document->content_format_version === 2
                ? app(MarkdownDocumentInspector::class)->inspect($document->markdown ?? '')->derived->attachmentIds
                : app(EditorContentInspector::class)->inspect($document->content)->attachmentIds;
            foreach ($ids as $id) {
                $add($id, $node);
            }
        }
        foreach (DatabaseValue::query()->whereIn('document_node_id', $nodes->keys())->whereIn('property_id', DatabaseProperty::query()->where('type', 'files')->select('id'))->cursor() as $value) {
            foreach ($value->value ?? [] as $id) {
                $add((int) $id, $nodes[$value->document_node_id]);
            }
        }

        return $usage;
    }

    private function hasTrashedAncestry(Node $node, Collection $nodes): bool
    {
        $seen = [];
        while (true) {
            if ($node->trashed() || isset($seen[$node->id])) {
                return true;
            }
            $seen[$node->id] = true;
            if ($node->parent_id === null) {
                return false;
            }
            $parent = $nodes->get($node->parent_id);
            if ($parent === null) {
                return true;
            }
            $node = $parent;
        }
    }
}
