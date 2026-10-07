<?php

namespace App\Actions\Documents;

use App\Models\Document;
use App\Models\Node;
use App\Services\Editor\MermaidPreviewCache;
use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownDocumentInspector;
use App\Services\Markdown\MarkdownReferenceValidator;
use App\Services\Markdown\MarkdownSaveData;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class SaveMarkdownDocument
{
    public function __construct(
        private readonly MarkdownDocumentInspector $inspector,
        private readonly MarkdownReferenceValidator $references,
        private readonly MermaidPreviewCache $mermaidPreviewCache,
    ) {}

    public function save(Node $node, MarkdownSaveData $data): Document
    {
        if ($data->contentFormatVersion !== MarkdownContract::FORMAT_VERSION) {
            throw ValidationException::withMessages(['content_format_version' => 'Markdown requires content format version 2 (orbium-markdown-v1).']);
        }
        if ($data->revision < 0) {
            throw ValidationException::withMessages(['revision' => 'Revision must be a nonnegative integer.']);
        }
        if ($node->type !== 'document' || $node->workspace === null || $node->workspace->trashed()) {
            MarkdownContract::invalid('The source document is unavailable.');
        }
        $inspection = $this->inspector->inspect($data->markdown);

        return DB::transaction(function () use ($node, $data, $inspection): Document {
            $document = Document::query()->whereKey($node->id)->lockForUpdate()->firstOrFail();
            if ($document->revision !== $data->revision) {
                throw ValidationException::withMessages(['revision' => 'This document changed elsewhere. Reload before saving.']);
            }
            if (! in_array($document->content_format_version, [1, MarkdownContract::FORMAT_VERSION], true)) {
                throw ValidationException::withMessages(['content_format_version' => 'This stored content format is unsupported.']);
            }
            $liveSource = Node::query()->where('workspace_id', $node->workspace_id)->where('type', 'document')->find($node->id);
            if ($liveSource === null) {
                MarkdownContract::invalid('The source document is in Trash.');
            }
            $this->references->validate($liveSource, $inspection);
            $document->update([
                'markdown' => $inspection->source,
                'content_format_version' => MarkdownContract::FORMAT_VERSION,
                'plain_text' => $inspection->derived->plainText,
                'revision' => $data->revision + 1,
            ]);
            $this->mermaidPreviewCache->removeObsoleteHashes($node->id, array_keys($inspection->derived->mermaidSourcesByHash));
            DB::table('mentions')->where('source_document_node_id', $node->id)->delete();
            foreach ($inspection->derived->mentions as $targetId => $label) {
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
}
