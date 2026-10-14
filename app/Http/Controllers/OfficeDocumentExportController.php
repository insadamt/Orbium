<?php

namespace App\Http\Controllers;

use App\Services\DocumentExport\OfficeDocumentExporter;
use App\Services\DocumentExport\OfficeDocumentModel;
use App\Services\DocumentExport\OfficeExportOptions;
use App\Services\Markdown\MarkdownDocumentInspector;
use App\Services\Markdown\MarkdownReferenceValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class OfficeDocumentExportController extends Controller
{
    public function __invoke(Request $request, int $workspace, int $node, MarkdownDocumentInspector $inspector, MarkdownReferenceValidator $references, OfficeDocumentModel $model, OfficeDocumentExporter $exporter): StreamedResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $document = $workspace->nodes()->where('type', 'document')->findOrFail($node);
        $data = $request->validate([
            'source' => ['sometimes', 'string', 'max:2097152'],
            'format' => ['required', 'in:docx,pdf'],
            'paper' => ['required', 'in:a4,letter'],
            'orientation' => ['required', 'in:portrait,landscape'],
            'page_numbers' => ['required', 'boolean'],
            'diagrams' => ['present', 'array', 'max:100'],
            'diagrams.*.hash' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/D'],
            'diagrams.*.png' => ['required', 'string', 'max:4194304'],
        ]);
        $source = $data['source'] ?? $document->document?->markdown;
        abort_unless(is_string($source), 422, 'Export requires a Markdown document.');
        $inspection = $inspector->inspect($source);
        $saved = $document->document?->markdown;
        $references->validate($document, $inspection, is_string($saved) ? $inspector->inspect($saved) : null);
        $options = new OfficeExportOptions(title: $document->title, format: $data['format'], paper: $data['paper'], orientation: $data['orientation'], pageNumbers: $data['page_numbers']);
        $lock = Cache::lock('office-export:'.$request->user()->id, 180);
        abort_unless($lock->get(), 429, 'Another document export is in progress. Please try again shortly.');
        try {
            $path = $exporter->generate($model->build($workspace, $document, $source), $options, $data['diagrams'], $inspection->derived->mermaidSourcesByHash);
        } finally {
            $lock->release();
        }
        $name = preg_replace('/[\x00-\x1f\\\\\/:*?"<>|]/u', '-', $document->title) ?? 'document';
        $name = mb_substr(rtrim(trim($name), '.'), 0, 120) ?: 'document';
        $mime = $data['format'] === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        return response()->streamDownload(function () use ($path): void {
            $previousIgnoreAbort = ignore_user_abort(true);
            try {
                readfile($path);
            } finally {
                File::deleteDirectory(dirname($path));
                ignore_user_abort($previousIgnoreAbort === 1);
            }
        }, $name.'.'.$data['format'], ['Content-Type' => $mime, 'Cache-Control' => 'private, no-store']);
    }
}
