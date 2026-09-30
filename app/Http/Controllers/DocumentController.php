<?php

namespace App\Http\Controllers;

use App\Actions\Documents\SaveDocument;
use App\Models\Attachment;
use App\Models\DatabaseProperty;
use App\Models\DatabaseValue;
use App\Models\Node;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function show(Request $request, int $workspace, int $node): Response
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $document = $documentNode->document()->firstOrFail();
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
            'document' => $document->only(['content', 'revision', 'cover_attachment_id', 'icon_attachment_id']),
            'databaseProperties' => $documentNode->parent?->type === 'database'
                ? DatabaseProperty::query()->where('database_node_id', $documentNode->parent_id)->orderBy('position')->get(['id', 'name', 'type', 'position', 'config']) : [],
            'databaseValues' => $documentNode->parent?->type === 'database'
                ? DatabaseValue::query()->where('document_node_id', $documentNode->id)->get(['property_id', 'value']) : [],
            'mentionCandidates' => $workspaceModel->nodes()->get(['id', 'title', 'type']),
            'databaseFiles' => Attachment::query()->where('workspace_id', $workspaceModel->id)
                ->where('owner_node_id', $documentNode->id)->get(['id', 'original_name']),
            'breadcrumbs' => [...$breadcrumbs, ...$ancestors],
        ]);
    }

    public function update(Request $request, int $workspace, int $node, SaveDocument $save): JsonResponse
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $data = $request->validate([
            'content' => ['required', 'array'],
            'revision' => ['required', 'integer', 'min:0'],
        ]);
        if (strlen(json_encode($data['content'], JSON_THROW_ON_ERROR)) > 1048576) {
            return response()->json(['message' => 'Document content exceeds 1 MB.'], 422);
        }
        $document = $save->save($documentNode, $data['content'], $data['revision']);

        return response()->json(['revision' => $document->revision, 'saved_at' => $document->updated_at?->toIso8601String()]);
    }

    public function updateHeader(Request $request, int $workspace, int $node): JsonResponse
    {
        $documentNode = $this->ownedDocument($request, $workspace, $node);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:16'],
            'cover_attachment_id' => ['sometimes', 'nullable', 'integer'],
            'icon_attachment_id' => ['sometimes', 'nullable', 'integer'],
        ]);
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
        $documentChanges = collect($data)->only(['cover_attachment_id', 'icon_attachment_id'])->all();
        if ($documentChanges !== []) {
            $documentNode->document()->update($documentChanges);
        }

        return response()->json([
            'title' => $documentNode->title,
            'icon' => $documentNode->icon,
            'cover_attachment_id' => $documentNode->document->cover_attachment_id,
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
