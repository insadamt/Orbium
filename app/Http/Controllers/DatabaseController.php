<?php

namespace App\Http\Controllers;

use App\Actions\Databases\ManageDatabase;
use App\Actions\Nodes\ManageHierarchy;
use App\Models\Attachment;
use App\Models\DatabaseProperty;
use App\Models\DatabaseValue;
use App\Models\DatabaseViewSetting;
use App\Models\Node;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DatabaseController extends Controller
{
    public function show(Request $request, int $workspace, int $node): Response
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $properties = DatabaseProperty::query()->where('database_node_id', $node)->orderBy('position')->orderBy('id')->get();
        $documents = $database->children()->where('type', 'document')->with('document')->orderBy('position')->orderBy('id')->get();
        $values = DatabaseValue::query()->whereIn('document_node_id', $documents->pluck('id'))->get();
        $views = DatabaseViewSetting::query()->where('database_node_id', $node)->get()->pluck('config', 'view_type');
        $ancestors = [];
        $parent = $database->parent;
        while ($parent !== null) {
            array_unshift($ancestors, ['title' => $parent->title, 'href' => route('nodes.show', [$workspace, $parent])]);
            $parent = $parent->parent;
        }

        return Inertia::render('databases/show', [
            'workspace' => $database->workspace->only(['id', 'name']),
            'database' => $database->only(['id', 'title', 'parent_id']),
            'properties' => $properties->map(fn (DatabaseProperty $property) => $property->only(['id', 'name', 'type', 'position', 'config']))->values(),
            'documents' => $documents->map(fn (Node $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'cover_attachment_id' => $document->document?->cover_attachment_id,
                'plain_text' => mb_substr($document->document?->plain_text ?? '', 0, 240),
            ]),
            'values' => $values->map(fn (DatabaseValue $value) => $value->only(['document_node_id', 'property_id', 'value'])),
            'views' => $views,
            'candidates' => $database->workspace->nodes()->get(['id', 'title', 'type']),
            'fileReferences' => Attachment::query()->where('workspace_id', $workspace)
                ->whereIn('owner_node_id', $documents->pluck('id'))->get(['id', 'original_name']),
            'breadcrumbs' => [
                ['title' => $database->workspace->name, 'href' => route('workspaces.show', $workspace)],
                ...$ancestors,
                ['title' => $database->title, 'href' => route('nodes.show', [$workspace, $node])],
            ],
        ]);
    }

    public function createDocument(Request $request, int $workspace, int $node, ManageHierarchy $hierarchy): RedirectResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $data = $request->validate(['title' => ['nullable', 'string', 'max:255']]);
        $document = $hierarchy->create($database->workspace, 'document', trim($data['title'] ?? '') ?: 'Untitled', $node);

        return to_route('documents.show', [$workspace, $document]);
    }

    public function createProperty(Request $request, int $workspace, int $node, ManageDatabase $action): RedirectResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $action->createProperty($database, $this->propertyData($request, true));

        return back();
    }

    public function updateProperty(Request $request, int $workspace, int $node, int $property, ManageDatabase $action): RedirectResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $action->updateProperty($database, $action->property($database, $property), $this->propertyData($request, false));

        return back();
    }

    public function reorderProperty(Request $request, int $workspace, int $node, int $property, ManageDatabase $action): RedirectResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $data = $request->validate(['position' => ['required', 'integer', 'min:0']]);
        $action->reorderProperty($database, $action->property($database, $property), $data['position']);

        return back();
    }

    public function deleteProperty(Request $request, int $workspace, int $node, int $property, ManageDatabase $action): RedirectResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $action->property($database, $property)->delete();

        return back();
    }

    public function writeValue(Request $request, int $workspace, int $node, int $document, int $property, ManageDatabase $action): JsonResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        $documentNode = $database->workspace->nodes()->findOrFail($document);
        $data = $request->validate(['value' => ['present']]);
        $action->writeValue($database, $documentNode, $action->property($database, $property), $data['value']);

        return response()->json(['ok' => true]);
    }

    public function saveView(Request $request, int $workspace, int $node, string $view, ManageDatabase $action): RedirectResponse
    {
        $database = $this->ownedDatabase($request, $workspace, $node);
        abort_unless(in_array($view, ['table', 'gallery', 'orbit'], true), 404);
        $data = $request->validate([
            'visible_property_ids' => ['sometimes', 'array'],
            'visible_property_ids.*' => ['integer'],
            'widths' => ['sometimes', 'array'],
            'preview' => ['sometimes', Rule::in(['cover', 'body', 'none'])],
            'filters' => ['sometimes', 'array', 'max:10'],
            'filters.*.property_id' => ['required', 'integer'],
            'filters.*.operator' => ['required', Rule::in(['is', 'is_not', 'contains', 'is_empty'])],
            'filters.*.value' => ['nullable'],
            'sorts' => ['sometimes', 'array', 'max:10'],
            'sorts.*.field' => ['required'],
            'sorts.*.direction' => ['required', Rule::in(['asc', 'desc'])],
        ]);
        $action->saveView($database, $view, $data);

        return back();
    }

    private function propertyData(Request $request, bool $creating): array
    {
        return $request->validate([
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'type' => [$creating ? 'required' : 'sometimes', Rule::in(ManageDatabase::TYPES)],
            'config' => ['sometimes', 'array'],
        ]);
    }

    private function ownedDatabase(Request $request, int $workspace, int $node): Node
    {
        $workspaceModel = $request->user()->workspaces()->findOrFail($workspace);
        $database = $workspaceModel->nodes()->where('type', 'database')->findOrFail($node);
        $ancestor = $database;
        while ($ancestor->parent_id !== null) {
            $ancestor = $workspaceModel->nodes()->findOrFail($ancestor->parent_id);
        }

        return $database;
    }
}
