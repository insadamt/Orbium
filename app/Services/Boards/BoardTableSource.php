<?php

namespace App\Services\Boards;

use App\Services\Markdown\MarkdownDocumentInspector;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\OrbiumBlock;
use Illuminate\Validation\ValidationException;
use League\CommonMark\Extension\Table\Table;

final class BoardTableSource
{
    public function validate(string $source, array $projection): void
    {
        $document = app(MarkdownParserService::class)->parse($source);
        $table = $document->firstChild();
        if (! $table || $table->next() || ! ($table instanceof Table || ($table instanceof OrbiumBlock && $table->kind() === 'table'))) {
            throw ValidationException::withMessages(['objects' => 'Board table source must contain exactly one table.']);
        }
        $rows = [];
        if ($table instanceof OrbiumBlock) {
            foreach ($table->children() as $row) {
                $rows[] = iterator_to_array($row->children(), false);
            }
        } else {
            foreach ($table->children() as $section) {
                foreach ($section->children() as $row) {
                    $rows[] = iterator_to_array($row->children(), false);
                }
            }
        }
        if (count($rows) !== count($projection)) {
            throw ValidationException::withMessages(['objects' => 'Board table source and rows must have matching dimensions.']);
        }
        foreach ($rows as $index => $row) {
            $columns = array_sum(array_map(fn ($cell): int => $cell instanceof OrbiumBlock ? (int) ($cell->metadata['colspan'] ?? 1) : 1, $row));
            if ($columns > 30) {
                throw ValidationException::withMessages(['objects' => 'Use a table with at most 30 columns.']);
            }
            if (count($row) !== count($projection[$index])) {
                throw ValidationException::withMessages(['objects' => 'Board table source and rows must have matching dimensions.']);
            }
        }
        //
        // Reuse the Document contract so rich cell syntax and references receive the same validation as ordinary Documents.
        //
        app(MarkdownDocumentInspector::class)->inspect($source);
    }

    public function attachmentIds(string $source): array
    {
        return app(MarkdownDocumentInspector::class)->inspect($source)->derived->attachmentIds;
    }
}
