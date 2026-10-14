<?php

namespace App\Http\Controllers;

use App\Actions\Nodes\ManageBulkNodes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BulkNodeController extends Controller
{
    public function __invoke(Request $request, int $workspace, ManageBulkNodes $bulkNodes): RedirectResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate([
            'node_ids' => ['required', 'array', 'min:1', 'max:100'],
            'node_ids.*' => ['required', 'integer', 'distinct'],
            'action' => ['required', 'in:move,trash'],
            'parent_id' => ['nullable', 'integer'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $bulkNodes->applyBulkAction($workspace, $data);

        return back();
    }
}
