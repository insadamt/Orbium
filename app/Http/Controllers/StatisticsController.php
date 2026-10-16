<?php

namespace App\Http\Controllers;

use App\Services\Statistics\StatisticsQuery;
use App\Services\Statistics\StatisticsScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class StatisticsController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('statistics/index', [
            'statisticsWorkspaces' => $request->user()->workspaces()->orderBy('position')->get(['id', 'name']),
            'breadcrumbs' => [['title' => 'Statistics', 'href' => '/statistics']],
        ]);
    }

    public function insights(string $metric): Response
    {
        return Inertia::render('statistics/insights', [
            'statisticsInsight' => $metric,
            'breadcrumbs' => [['title' => 'Statistics', 'href' => '/statistics']],
        ]);
    }

    public function data(Request $request, StatisticsQuery $query): JsonResponse
    {
        $data = $request->validate(['workspace_id' => ['nullable', 'integer', 'min:1']]);
        $workspace = isset($data['workspace_id']) ? $request->user()->workspaces()->whereKey($request->integer('workspace_id'))->firstOrFail() : null;
        $scope = $workspace === null
            ? new StatisticsScope($request->user()->id, 'account', 'All workspaces')
            : new StatisticsScope($request->user()->id, 'workspace', $workspace->name, $workspace->id);

        return response()->json($query->summary($scope)->toArray())->header('Cache-Control', 'private, no-store');
    }

    public function node(Request $request, int $workspace, int $node, StatisticsQuery $query): JsonResponse
    {
        $workspaceModel = $request->user()->workspaces()->findOrFail($workspace);
        $nodeModel = $workspaceModel->nodes()->findOrFail($node);
        $kind = match ($nodeModel->type) {
            'document' => 'document',
            'database' => 'database',
            'folder' => 'folder',
            default => abort(404),
        };
        $scope = new StatisticsScope($request->user()->id, $kind, $nodeModel->title, $workspace, $node);

        return response()->json($query->summary($scope)->toArray())->header('Cache-Control', 'private, no-store');
    }
}
