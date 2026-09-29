<?php

namespace App\Actions\Workspaces;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class ManageWorkspaces
{
    public function create(User $user, string $name): Workspace
    {
        return DB::transaction(function () use ($user, $name): Workspace {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            return $user->workspaces()->create([
                'name' => $name,
                'position' => $user->workspaces()->count(),
            ]);
        });
    }

    public function trash(Workspace $workspace): void
    {
        DB::transaction(function () use ($workspace): void {
            User::query()->whereKey($workspace->user_id)->lockForUpdate()->firstOrFail();
            $workspace->delete();
            $this->writePositions($workspace->user->workspaces()->orderBy('position')->orderBy('id')->get()->all());
        });
    }

    public function restore(Workspace $workspace): void
    {
        DB::transaction(function () use ($workspace): void {
            User::query()->whereKey($workspace->user_id)->lockForUpdate()->firstOrFail();
            $workspace->position = $workspace->user->workspaces()->count();
            $workspace->restore();
            $workspace->save();
        });
    }

    public function reorder(Workspace $workspace, int $position): void
    {
        DB::transaction(function () use ($workspace, $position): void {
            User::query()->whereKey($workspace->user_id)->lockForUpdate()->firstOrFail();
            $siblings = $workspace->user->workspaces()->whereKeyNot($workspace->id)
                ->orderBy('position')->orderBy('id')->get()->all();
            array_splice($siblings, min($position, count($siblings)), 0, [$workspace]);
            $this->writePositions($siblings);
        });
    }

    /** @param array<int, Workspace> $workspaces */
    private function writePositions(array $workspaces): void
    {
        foreach ($workspaces as $position => $workspace) {
            if ($workspace->position !== $position) {
                $workspace->position = max(0, $position);
                $workspace->save();
            }
        }
    }
}
