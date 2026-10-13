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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

final class LibraryCatalog
{
    public function files(Workspace $workspace): array
    {
        $usage = $this->usage($workspace);

        return Attachment::query()->where('workspace_id', $workspace->id)->latest()->get()
            ->map(fn (Attachment $file) => [
                'id' => $file->id,
                'name' => $file->original_name,
                'mime_type' => $file->mime_type,
                'size_bytes' => $file->size_bytes,
                'created_at' => $file->created_at->toISOString(),
                'url' => route('library.files.show', [$workspace, $file]),
                'available' => Storage::disk('local')->exists($file->storage_key),
                'usage' => array_values($usage[$file->id] ?? []),
            ])->all();
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
