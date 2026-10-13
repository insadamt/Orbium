<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class SerializeWorkspaceWrites
{
    public function handle(Request $request, Closure $next): Response
    {
        $workspaceId = $request->route('workspace');
        if ($request->isMethodSafe() || $workspaceId === null) {
            return $next($request);
        }

        // Reference validation and Library deletion must observe the same committed workspace state.
        return DB::transaction(function () use ($request, $next, $workspaceId): Response {
            $request->user()->workspaces()->withTrashed()->whereKey($workspaceId)->lockForUpdate()->firstOrFail();

            return $next($request);
        });
    }
}
