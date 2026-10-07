<?php

namespace App\Services\Markdown;

use App\Models\Attachment;
use App\Models\Node;

final class MarkdownReferenceValidator
{
    public function validate(Node $source, MarkdownInspectionResult $inspection): void
    {
        $this->validateLiveAncestry($source, $source->workspace_id);
        $targets = Node::query()->where('workspace_id', $source->workspace_id)
            ->whereIn('id', array_keys($inspection->derived->mentions))->get();
        if ($targets->count() !== count($inspection->derived->mentions)) {
            MarkdownContract::invalid('A mentioned item is unavailable in this workspace.');
        }
        foreach ($targets as $target) {
            $this->validateLiveAncestry($target, $source->workspace_id);
        }
        $attachments = Attachment::query()->where('workspace_id', $source->workspace_id)
            ->where('owner_node_id', $source->id)->whereIn('id', $inspection->derived->attachmentIds)->get()->keyBy('id');
        if ($attachments->count() !== count($inspection->derived->attachmentIds)) {
            MarkdownContract::invalid('A file is unavailable in this document.');
        }
        foreach ($inspection->attachmentReferences as $reference) {
            $attachment = $attachments[$reference->id];
            if ($reference->isImage && ($attachment->purpose !== 'image'
                || ! in_array($attachment->mime_type, ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true))) {
                MarkdownContract::invalid('An image reference must use an owned PNG, JPEG, GIF, or WebP image attachment.', $reference->sourceLine);
            }
        }
    }

    private function validateLiveAncestry(Node $node, int $workspaceId): void
    {
        $visited = [];
        while (true) {
            if ($node->trashed() || isset($visited[$node->id]) || count($visited) >= 1000) {
                MarkdownContract::invalid('A referenced item has invalid or trashed ancestry.');
            }
            $visited[$node->id] = true;
            if ($node->parent_id === null) {
                return;
            }
            $parent = Node::query()->where('workspace_id', $workspaceId)->find($node->parent_id);
            if ($parent === null || ! in_array($parent->type, ['folder', 'database'], true)
                || ($parent->type === 'database' && $node->type !== 'document')) {
                MarkdownContract::invalid('A referenced item has unavailable or invalid ancestry.');
            }
            $node = $parent;
        }
    }
}
