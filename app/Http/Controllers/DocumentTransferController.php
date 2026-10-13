<?php

namespace App\Http\Controllers;

use App\Actions\Documents\SaveMarkdownDocument;
use App\Actions\Nodes\ManageHierarchy;
use App\Models\Attachment;
use App\Models\Node;
use App\Models\Workspace;
use App\Services\DocumentTransfer\DocumentMarkdownSerializer;
use App\Services\DocumentTransfer\DocumentPackage;
use App\Services\DocumentTransfer\TransferSerializationOptions;
use App\Services\Markdown\MarkdownDocumentInspector;
use App\Services\Markdown\MarkdownReferenceValidator;
use App\Services\Markdown\MarkdownSaveData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class DocumentTransferController extends Controller
{
    public function exportData(Request $request, int $workspace, int $node, MarkdownDocumentInspector $inspector, MarkdownReferenceValidator $references): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $main = $workspace->nodes()->where('type', 'document')->findOrFail($node);
        $source = $request->input('source');
        $documents = [];
        $markdown = is_string($source) ? $source : $main->document?->markdown;
        abort_unless(is_string($markdown), 422, 'Export requires a Markdown document.');
        $inspection = $inspector->inspect($markdown);
        $references->validate($main, $inspection);
        $documents[] = ['id' => $main->id, 'title' => $main->title, 'source' => $markdown, 'plain' => $this->singleSource($workspace, $main, $markdown, false), 'single' => $this->singleSource($workspace, $main, $markdown, true),
            'attachments' => Attachment::query()->where('owner_node_id', $main->id)->whereIn('id', $inspection->derived->attachmentIds)->get(['id', 'original_name', 'mime_type', 'size_bytes', 'sha256', 'purpose'])->toArray()];
        $relatedIds = array_keys($inspector->inspect($documents[0]['source'])->derived->mentions);
        foreach ($workspace->nodes()->where('type', 'document')->whereIn('id', $relatedIds)->whereKeyNot($node)->limit(100)->get() as $related) {
            $markdown = $related->document?->markdown;
            if (! is_string($markdown)) {
                continue;
            }
            $inspection = $inspector->inspect($markdown);
            $references->validate($related, $inspection);
            $documents[] = ['id' => $related->id, 'title' => $related->title, 'source' => $markdown, 'plain' => $this->singleSource($workspace, $related, $markdown, false),
                'attachments' => Attachment::query()->where('owner_node_id', $related->id)->whereIn('id', $inspection->derived->attachmentIds)->get(['id', 'original_name', 'mime_type', 'size_bytes', 'sha256', 'purpose'])->toArray()];
        }

        return response()->json(['documents' => $documents]);
    }

    public function exportPackage(Request $request, int $workspace, DocumentPackage $packages): BinaryFileResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['documents' => ['required', 'array', 'min:1', 'max:101'], 'documents.*.id' => ['required', 'integer'], 'documents.*.source' => ['present', 'string'], 'format' => ['required', 'in:md,orbie'], 'attachment_ids' => ['present', 'array'], 'attachment_ids.*' => ['integer']]);
        $path = $packages->export($workspace, $data);

        return response()->download($path, 'orbium-documents.zip')->deleteFileAfterSend(true);
    }

    public function import(Request $request, int $workspace, DocumentPackage $packages): JsonResponse|StreamedResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['parent_id' => ['nullable', 'integer'], 'file' => ['required', 'file', 'max:102400'], 'verify_only' => ['sometimes', 'boolean']]);
        if (isset($data['parent_id'])) {
            $parent = $workspace->nodes()->where('type', 'folder')->whereKey($data['parent_id'])->firstOrFail();
            $this->assertVisible($workspace, $parent);
        }
        $package = $packages->verify($data['file']);
        if ($request->boolean('verify_only')) {
            return response()->json(['documents' => count($package['documents']), 'assets' => count($package['assets'])]);
        }

        return response()->stream(function () use ($packages, $workspace, $data, $package) {
            $previousIgnoreAbort = ignore_user_abort(true);
            $emit = static function (array $event): void {
                echo json_encode($event, JSON_THROW_ON_ERROR)."\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                } flush();
            };
            try {
                $result = $packages->import($workspace, isset($data['parent_id']) ? (int) $data['parent_id'] : null, $package, fn ($stage) => $emit(['stage' => $stage]));
                $emit(['result' => $result]);
            } catch (\Throwable $failure) {
                report($failure);
                $emit(['error' => 'Import failed. No documents or files were kept.']);
            } finally {
                ignore_user_abort($previousIgnoreAbort === 1);
            }
        }, 200, ['Content-Type' => 'application/x-ndjson', 'X-Accel-Buffering' => 'no']);
    }

    public function importDocument(Request $request, int $workspace): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['parent_id' => ['nullable', 'integer'], 'title' => ['required', 'string', 'max:255'], 'source' => ['present', 'string', 'max:2097152']]);
        if (isset($data['parent_id'])) {
            $this->assertVisible($workspace, $workspace->nodes()->where('type', 'folder')->whereKey($data['parent_id'])->firstOrFail());
        }
        $result = DB::transaction(function () use ($workspace, $data) {
            $node = app(ManageHierarchy::class)->create($workspace, 'document', $data['title'], isset($data['parent_id']) ? (int) $data['parent_id'] : null);
            app(SaveMarkdownDocument::class)->save($node, new MarkdownSaveData($data['source'], 0, 2));

            return ['node_id' => $node->id, 'documents' => 1, 'assets' => 0];
        });

        return response()->json($result);
    }

    private function singleSource(Workspace $workspace, Node $node, string $source, bool $native): string
    {
        $inspection = app(MarkdownDocumentInspector::class)->inspect($source);
        $nodes = [];
        $attachments = [];
        foreach (array_keys($inspection->derived->mentions) as $id) {
            $nodes[$id] = url('/workspaces/'.$workspace->id.'/nodes/'.$id);
        }
        foreach ($inspection->derived->attachmentIds as $id) {
            $attachments[$id] = url('/workspaces/'.$workspace->id.'/documents/'.$node->id.'/attachments/'.$id);
        }

        return app(DocumentMarkdownSerializer::class)->serialize($source, new TransferSerializationOptions($native, $nodes, $attachments, $native ? $inspection->derived->attachmentIds : []));
    }

    private function assertVisible(Workspace $workspace, Node $node): void
    {
        while ($node->parent_id !== null) {
            $node = $workspace->nodes()->findOrFail($node->parent_id);
        }
    }
}
