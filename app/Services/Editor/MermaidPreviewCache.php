<?php

namespace App\Services\Editor;

use App\Models\Document;
use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownDocumentInspector;
use Illuminate\Support\Facades\DB;

class MermaidPreviewCache
{
    public const RENDERER_VERSION = 'mermaid-12.0.0-neutral-strict-v1';

    public function __construct(private readonly MarkdownDocumentInspector $markdownInspector) {}

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
        $this->removeObsoleteHashes($documentNodeId, array_map(
            static fn (string $source): string => hash('sha256', $source),
            $this->sourcesInDocument($content),
        ));
    }

    /** @param array<int, string> $hashes */
    public function removeObsoleteHashes(int $documentNodeId, array $hashes): void
    {
        DB::table('document_mermaid_previews')
            ->where('document_node_id', $documentNodeId)
            ->where('renderer_version', '!=', self::RENDERER_VERSION)
            ->delete();
        $query = DB::table('document_mermaid_previews')->where('document_node_id', $documentNodeId);
        if ($hashes !== []) {
            $query->whereNotIn('source_hash', $hashes);
        }
        $query->delete();
    }

    /** @return array{svg: string, renderId: string}|null */
    public function previewForDocument(int $documentNodeId, string $sourceHash): ?array
    {
        // Rows can only be inserted for saved sources and are removed under the same document lock on save.
        $row = DB::table('document_mermaid_previews')
            ->where('document_node_id', $documentNodeId)
            ->where('renderer_version', self::RENDERER_VERSION)
            ->where('source_hash', $sourceHash)
            ->first(['svg', 'render_id']);

        return $row ? ['svg' => $row->svg, 'renderId' => $row->render_id] : null;
    }

    /** @return list<string> */
    private function sourcesInSavedDocument(Document $document): array
    {
        return match ($document->content_format_version) {
            1 => array_values($this->sourcesInDocument($document->content)),
            MarkdownContract::FORMAT_VERSION => array_values($this->markdownInspector->inspect(
                $document->markdown ?? MarkdownContract::invalid('Stored Markdown source is missing.'),
            )->derived->mermaidSourcesByHash),
            default => MarkdownContract::invalid('Stored document format is unsupported.'),
        };
    }

    public function storeForSavedSource(int $documentNodeId, string $source, string $renderId, string $svg): void
    {
        DB::transaction(function () use ($documentNodeId, $source, $renderId, $svg): void {
            $document = Document::query()->whereKey($documentNodeId)->lockForUpdate()->firstOrFail();
            $sources = $this->sourcesInSavedDocument($document);
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
