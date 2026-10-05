<?php

namespace App\Services\Editor;

use App\Models\Document;
use Illuminate\Support\Facades\DB;

class MermaidPreviewCache
{
    public const RENDERER_VERSION = 'mermaid-12.0.0-neutral-strict-v1';

    /** @param array<string, mixed> $content
     * @return array<int, string>
     */
    public function sourcesInDocument(array $content): array
    {
        $sources = [];
        $visit = function (array $node) use (&$visit, &$sources): void {
            if (($node['type'] ?? null) === 'mermaid' && is_string($node['attrs']['source'] ?? null)) {
                $sources[$node['attrs']['source']] = $node['attrs']['source'];
            }
            foreach ($node['content'] ?? [] as $child) {
                if (is_array($child)) {
                    $visit($child);
                }
            }
        };
        $visit($content);

        return array_values($sources);
    }

    /** @param array<string, mixed> $content
     * @return array<string, array{svg: string, renderId: string}>
     */
    public function previewsForDocument(int $documentNodeId, array $content): array
    {
        $sourcesByHash = [];
        foreach ($this->sourcesInDocument($content) as $source) {
            $sourcesByHash[hash('sha256', $source)] = $source;
        }
        if ($sourcesByHash === []) {
            return [];
        }

        $previews = [];
        $rows = DB::table('document_mermaid_previews')
            ->where('document_node_id', $documentNodeId)
            ->where('renderer_version', self::RENDERER_VERSION)
            ->whereIn('source_hash', array_keys($sourcesByHash))
            ->get(['source_hash', 'svg', 'render_id']);
        foreach ($rows as $row) {
            $previews[$sourcesByHash[$row->source_hash]] = [
                'svg' => $row->svg,
                'renderId' => $row->render_id,
            ];
        }

        return $previews;
    }

    /** @param array<string, mixed> $content */
    public function removeObsoletePreviews(int $documentNodeId, array $content): void
    {
        DB::table('document_mermaid_previews')
            ->where('document_node_id', $documentNodeId)
            ->where('renderer_version', '!=', self::RENDERER_VERSION)
            ->delete();
        $hashes = array_map(
            static fn (string $source): string => hash('sha256', $source),
            $this->sourcesInDocument($content),
        );
        $query = DB::table('document_mermaid_previews')->where('document_node_id', $documentNodeId);
        if ($hashes !== []) {
            $query->whereNotIn('source_hash', $hashes);
        }
        $query->delete();
    }

    public function storeForSavedSource(int $documentNodeId, string $source, string $renderId, string $svg): void
    {
        DB::transaction(function () use ($documentNodeId, $source, $renderId, $svg): void {
            $document = Document::query()->whereKey($documentNodeId)->lockForUpdate()->firstOrFail();
            $sources = $this->sourcesInDocument($document->content);
            abort_unless(in_array($source, $sources, true), 422);

            $documentPreviews = DB::table('document_mermaid_previews')
                ->where('document_node_id', $documentNodeId)
                ->where('renderer_version', self::RENDERER_VERSION);
            $sourceHash = hash('sha256', $source);
            abort_unless(
                (clone $documentPreviews)->where('source_hash', $sourceHash)->exists()
                    || $documentPreviews->count() < 200,
                422,
            );

            DB::table('document_mermaid_previews')->updateOrInsert(
                [
                    'document_node_id' => $documentNodeId,
                    'source_hash' => $sourceHash,
                    'renderer_version' => self::RENDERER_VERSION,
                ],
                ['render_id' => $renderId, 'svg' => $svg, 'updated_at' => now(), 'created_at' => now()],
            );
        });
    }
}
