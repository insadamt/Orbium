<?php

namespace App\Http\Controllers;

use App\Actions\Documents\SaveDocument;
use App\Actions\Documents\SaveMarkdownDocument;
use App\Models\Attachment;
use App\Models\DatabaseProperty;
use App\Models\DatabaseValue;
use App\Models\Node;
use App\Services\Editor\MermaidPreviewCache;
use App\Services\Markdown\MarkdownContract;
use App\Services\Markdown\MarkdownSaveData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function show(Request $request, int $workspace, int $node): Response
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $document = $documentNode->document()->firstOrFail();
        abort_if($document->content_format_version !== 1, 409, 'This Markdown document requires the M2 editor. Use a separate document for M1 API verification.');
        $workspaceModel = $documentNode->workspace;
        $breadcrumbs = [['title' => $workspaceModel->name, 'href' => route('workspaces.show', $workspaceModel)]];
        $ancestors = [];
        $parent = $documentNode->parent;
        while ($parent !== null) {
            array_unshift($ancestors, ['title' => $parent->title, 'href' => route('nodes.show', [$workspaceModel, $parent])]);
            $parent = $parent->parent;
        }

        return Inertia::render('documents/show', [
            'workspace' => $workspaceModel->only(['id', 'name']),
            'node' => $documentNode->only(['id', 'title', 'icon', 'parent_id']),
            'document' => $document->only(['content', 'revision', 'cover_attachment_id', 'cover_aspect_ratio', 'icon_attachment_id']),
            'databaseProperties' => $documentNode->parent?->type === 'database'
                ? DatabaseProperty::query()->where('database_node_id', $documentNode->parent_id)->orderBy('position')->get(['id', 'name', 'type', 'position', 'config']) : [],
            'databaseValues' => $documentNode->parent?->type === 'database'
                ? DatabaseValue::query()->where('document_node_id', $documentNode->id)->get(['property_id', 'value']) : [],
            'mentionCandidates' => $documentNode->parent?->type === 'database' ? $workspaceModel->nodes()->get(['id', 'title', 'type']) : [],
            'databaseFiles' => $documentNode->parent?->type === 'database' ? Attachment::query()->where('workspace_id', $workspaceModel->id)
                ->where('owner_node_id', $documentNode->id)->get(['id', 'original_name']) : [],
            'breadcrumbs' => [...$breadcrumbs, ...$ancestors],
        ]);
    }

    public function update(Request $request, int $workspace, int $node, SaveDocument $save): JsonResponse
    {
        $started = hrtime(true);
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $data = $request->validate([
            'content' => ['required', 'array'],
            'revision' => ['required', 'integer', 'min:0'],
        ]);
        if (strlen(json_encode($data['content'], JSON_THROW_ON_ERROR)) > 1048576) {
            return response()->json(['message' => 'Document content exceeds 1 MB.'], 422);
        }
        $validatedAt = hrtime(true);
        $document = $save->save($documentNode, $data['content'], $data['revision']);

        $response = response()->json(['revision' => $document->revision, 'saved_at' => $document->updated_at?->toIso8601String()]);
        if (app()->isLocal()) {
            $response->header('Server-Timing', sprintf('validation;dur=%.2f,save;dur=%.2f', ($validatedAt - $started) / 1e6, (hrtime(true) - $validatedAt) / 1e6));
        }

        return $response;
    }

    public function updateMarkdown(Request $request, int $workspace, int $node, SaveMarkdownDocument $save): JsonResponse
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        abort_unless($request->isJson(), 415, 'Markdown saves require application/json.');
        $data = $request->validate([
            'markdown' => ['present', 'string'],
            'revision' => ['required', 'integer', 'min:0'],
            'content_format_version' => ['required', 'integer', Rule::in([MarkdownContract::FORMAT_VERSION])],
            'plain_text' => ['prohibited'],
            'mentions' => ['prohibited'],
            'attachment_ids' => ['prohibited'],
            'mermaid_sources_by_hash' => ['prohibited'],
        ]);
        $document = $save->save($documentNode, new MarkdownSaveData(
            $data['markdown'], (int) $data['revision'], (int) $data['content_format_version'],
        ));

        return response()->json(['revision' => $document->revision, 'saved_at' => $document->updated_at?->toIso8601String()]);
    }

    public function showMermaidPreview(Request $request, int $workspace, int $node, string $sourceHash, MermaidPreviewCache $mermaidPreviewCache): JsonResponse
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $request->validate(['rendererVersion' => ['required', Rule::in([MermaidPreviewCache::RENDERER_VERSION])]]);

        return response()->json(['preview' => $mermaidPreviewCache->previewForDocument($documentNode->id, $sourceHash)])
            ->header('Cache-Control', 'private, no-store');
    }

    public function storeMermaidPreview(Request $request, int $workspace, int $node, MermaidPreviewCache $mermaidPreviewCache): JsonResponse
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $data = $request->validate([
            'source' => ['required', 'string', 'max:50000'],
            'renderId' => ['required', 'string', 'max:100', 'regex:/^orbium-mermaid-[a-f0-9-]+$/'],
            'svg' => ['required', 'string', 'max:524288'],
            'rendererVersion' => ['required', 'string', Rule::in([MermaidPreviewCache::RENDERER_VERSION])],
        ]);
        abort_unless(str_starts_with(ltrim($data['svg']), '<svg'), 422);

        $mermaidPreviewCache->storeForSavedSource($documentNode->id, $data['source'], $data['renderId'], $data['svg']);

        return response()->json(['stored' => true]);
    }

    public function updateHeader(Request $request, int $workspace, int $node): JsonResponse
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:16'],
            'cover_attachment_id' => ['sometimes', 'nullable', 'integer'],
            'cover_aspect_ratio' => ['sometimes', 'nullable', Rule::in(['16:9', '9:16', '3:2', '4:3', '1:1', '4:5'])],
            'icon_attachment_id' => ['sometimes', 'nullable', 'integer'],
        ]);
        if (isset($data['cover_attachment_id']) && $data['cover_attachment_id'] !== $documentNode->document->cover_attachment_id && empty($data['cover_aspect_ratio'])) {
            throw ValidationException::withMessages(['cover_aspect_ratio' => 'Choose a cover aspect ratio.']);
        }
        if (array_key_exists('cover_aspect_ratio', $data) && ! array_key_exists('cover_attachment_id', $data)) {
            throw ValidationException::withMessages(['cover_attachment_id' => 'Select a cover with its aspect ratio.']);
        }
        foreach (['cover_attachment_id', 'icon_attachment_id'] as $attachmentField) {
            if (! array_key_exists($attachmentField, $data) || $data[$attachmentField] === null) {
                continue;
            }
            $validImage = Attachment::query()->where('workspace_id', $documentNode->workspace_id)
                ->where('owner_node_id', $documentNode->id)->where('purpose', 'image')
                ->whereKey($data[$attachmentField])->exists();
            abort_unless($validImage, 422);
        }
        $documentNode->update(collect($data)->only(['title', 'icon'])->all());
        $documentChanges = collect($data)->only(['cover_attachment_id', 'cover_aspect_ratio', 'icon_attachment_id'])->all();
        if (array_key_exists('cover_attachment_id', $data) && $data['cover_attachment_id'] === null) {
            $documentChanges['cover_aspect_ratio'] = null;
        }
        if ($documentChanges !== []) {
            $documentNode->document()->update($documentChanges);
        }

        return response()->json([
            'title' => $documentNode->title,
            'icon' => $documentNode->icon,
            'cover_attachment_id' => $documentNode->document->cover_attachment_id,
            'cover_aspect_ratio' => $documentNode->document->cover_aspect_ratio,
            'icon_attachment_id' => $documentNode->document->icon_attachment_id,
        ]);
    }

    private function ownedDocument(Request $request, int $workspaceId, int $nodeId): Node
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspaceId);
        $node = $workspace->nodes()->where('type', 'document')->findOrFail($nodeId);
        $ancestor = $node;
        while ($ancestor->parent_id !== null) {
            $ancestor = $workspace->nodes()->findOrFail($ancestor->parent_id);
        }

        return $node;
    }
}
