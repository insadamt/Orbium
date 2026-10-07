<?php

namespace App\Actions\Documents;

use App\Models\Attachment;
use App\Models\Document;
use App\Models\Node;
use App\Services\Editor\EditorContentInspector;
use App\Services\Editor\MermaidPreviewCache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaveDocument
{
    public function __construct(private EditorContentInspector $inspector, private MermaidPreviewCache $mermaidPreviewCache) {}

    /** @param array<string, mixed> $content */
    public function save(Node $node, array $content, int $revision): Document
    {
        $inspection = $this->inspector->inspect($content);
        $mentions = $inspection->mentions;
        $attachmentIds = $inspection->attachmentIds;

        return DB::transaction(function () use ($node, $content, $revision, $mentions, $attachmentIds, $inspection): Document {
            $document = Document::query()->whereKey($node->id)->lockForUpdate()->firstOrFail();
            if ($document->content_format_version !== 1) {
                throw ValidationException::withMessages(['content_format_version' => 'This document cannot be saved by the Tiptap editor.']);
            }
            if ($document->revision !== $revision) {
                throw ValidationException::withMessages(['revision' => 'This document changed elsewhere. Reload before saving.']);
            }

            $this->validateMentions($node, array_keys($mentions));
            $this->validateAttachments($node, $attachmentIds);

            $document->update([
                'content' => $content,
                'plain_text' => $inspection->plainText,
                'revision' => $revision + 1,
            ]);

            $this->mermaidPreviewCache->removeObsoleteHashes($node->id, array_keys($inspection->mermaidSourcesByHash));

            DB::table('mentions')->where('source_document_node_id', $node->id)->delete();
            foreach ($mentions as $targetId => $label) {
                DB::table('mentions')->insert([
                    'source_document_node_id' => $node->id,
                    'target_node_id' => $targetId,
                    'display_text' => $label,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $document;
        });
    }

    /** @param array<int, int> $targetIds */
    private function validateMentions(Node $source, array $targetIds): void
    {
        if ($targetIds === []) {
            return;
        }
        $targets = Node::query()->where('workspace_id', $source->workspace_id)->whereIn('id', $targetIds)->get();
        if ($targets->count() !== count($targetIds)) {
            throw ValidationException::withMessages(['content' => 'A mentioned item is unavailable in this workspace.']);
        }
        foreach ($targets as $target) {
            $ancestor = $target;
            while ($ancestor->parent_id !== null) {
                $ancestor = Node::query()->where('workspace_id', $source->workspace_id)->find($ancestor->parent_id);
                if ($ancestor === null) {
                    throw ValidationException::withMessages(['content' => 'A mentioned item is in Trash.']);
                }
            }
        }
    }

    /** @param array<int, int> $attachmentIds */
    private function validateAttachments(Node $source, array $attachmentIds): void
    {
        if ($attachmentIds === []) {
            return;
        }
        $count = Attachment::query()->where('workspace_id', $source->workspace_id)
            ->where('owner_node_id', $source->id)->whereIn('id', $attachmentIds)->count();
        if ($count !== count($attachmentIds)) {
            throw ValidationException::withMessages(['content' => 'A file is unavailable in this document.']);
        }
    }
}
