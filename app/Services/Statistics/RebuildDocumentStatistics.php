<?php

namespace App\Services\Statistics;

use App\Models\Document;
use App\Services\Editor\EditorContentInspector;
use App\Services\Markdown\MarkdownDocumentInspector;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

final class RebuildDocumentStatistics
{
    public function __construct(
        private readonly EditorContentInspector $legacyInspector,
        private readonly MarkdownDocumentInspector $markdownInspector,
    ) {}

    /** @return 'rebuilt'|'skipped'|'failed' */
    public function rebuild(int $documentId, bool $force): string
    {
        return DB::transaction(function () use ($documentId, $force): string {
            $document = Document::query()->whereKey($documentId)->lockForUpdate()->first();
            if ($document === null || (! $force && $document->statistics_version === DocumentStatisticsData::VERSION)) {
                return 'skipped';
            }
            try {
                $inspection = match ($document->content_format_version) {
                    1 => $this->legacyInspector->inspect($document->content),
                    2 => is_string($document->markdown) ? $this->markdownInspector->inspect($document->markdown)->derived : throw new RuntimeException('Markdown source is unavailable.'),
                    default => throw new RuntimeException('Unsupported document content format.'),
                };
                $attributes = $inspection->statistics->attributes($inspection->attachmentIds);
            } catch (Throwable $error) {
                report($error);
                $document->timestamps = false;
                $document->statistics_version = null;
                $document->save();

                return 'failed';
            }
            $document->timestamps = false;
            $document->fill($attributes)->save();

            return 'rebuilt';
        });
    }
}
