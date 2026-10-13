<?php

namespace App\Http\Controllers;

use App\Services\References\OwnedReferenceAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReferenceAvailabilityController extends Controller
{
    public function show(Request $request, int $workspace, OwnedReferenceAvailability $references): JsonResponse
    {
        $workspace = $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['kind' => ['required', 'in:node,attachment'], 'id' => ['required', 'integer', 'min:1'], 'owner_id' => ['required_if:kind,attachment', 'integer', 'min:1']]);
        $available = $data['kind'] === 'node' ? $references->findNode($workspace, (int) $data['id']) !== null : $references->findAttachment($workspace, (int) $data['owner_id'], (int) $data['id']) !== null;

        return response()->json(['available' => $available])->header('Cache-Control', 'no-store');
    }
}
