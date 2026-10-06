<?php

namespace App\Actions\Trash;

use App\Actions\Nodes\ManageHierarchy;
use App\Actions\Workspaces\ManageWorkspaces;
use App\Models\Attachment;
use App\Models\Node;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ManageTrash
{
    public function preview(TrashCatalog $catalog, TrashSelection $selection): array
    {
        $keys = $selection->resolveKeys($catalog);
        $entries = array_map($catalog->entry(...), $keys);
        $nodes = collect();
        $attachments = collect();
        foreach ($keys as $key) {
            $contained = $catalog->containedNodes($key);
            $nodes = $nodes->union($contained);
            foreach ($catalog->containedAttachments($key, $contained) as $attachment) {
                $attachments->put($attachment->id, $attachment);
            }
        }
        $fingerprint = hash('sha256', json_encode([
            $entries, $nodes->sortKeys()->toArray(), $attachments->sortKeys()->toArray(),
        ], JSON_THROW_ON_ERROR));

        return [
            'entries' => $entries,
            'node_count' => $nodes->count(),
            'node_ids' => $nodes->keys()->values()->all(),
            'workspace_ids' => array_values(array_map(fn (array $entry) => $entry['workspace_id'], array_filter($entries, fn (array $entry) => $entry['type'] === 'workspace'))),
            'attachment_count' => $attachments->count(),
            'size_bytes' => $attachments->sum('size_bytes'),
            'fingerprint' => $fingerprint,
        ];
    }

    public function restore(User $user, TrashSelection $selection, bool $restoreAncestors): void
    {
        DB::transaction(function () use ($user, $selection, $restoreAncestors): void {
            $catalog = $this->lockAndReadCatalog($user);
            $keys = $selection->resolveKeys($catalog);
            foreach ($keys as $key) {
                $entry = $catalog->entry($key);
                if ($entry['restore_ancestors'] !== [] && ! $restoreAncestors) {
                    throw ValidationException::withMessages(['trash' => 'Restore with ancestors to recover this item in its original location.']);
                }
            }
            $orderedKeys = [];
            foreach ($keys as $key) {
                foreach ([...$catalog->entry($key)['restore_ancestors'], $key] as $restoreKey) {
                    $orderedKeys[$restoreKey] = $restoreKey;
                }
            }
            foreach ($orderedKeys as $key) {
                [$kind, $id] = explode(':', $key);
                if ($kind === 'workspace') {
                    app(ManageWorkspaces::class)->restore($catalog->workspaces[(int) $id]);
                } else {
                    app(ManageHierarchy::class)->restore($catalog->nodes[(int) $id]);
                }
            }
        });
    }

    public function deletePermanently(User $user, TrashSelection $selection, string $fingerprint, array $confirmedNames): bool
    {
        $storageKeys = DB::transaction(function () use ($user, $selection, $fingerprint, $confirmedNames): array {
            $catalog = $this->lockAndReadCatalog($user);
            $preview = $this->preview($catalog, $selection);
            if (! hash_equals($preview['fingerprint'], $fingerprint)) {
                throw ValidationException::withMessages(['trash' => 'Trash changed. Close this dialog and review the deletion again.']);
            }
            $nodeIds = [];
            $attachmentIds = [];
            $workspaceIds = [];
            $storageKeys = [];
            foreach ($preview['entries'] as $entry) {
                if ($entry['type'] === 'workspace') {
                    if (($confirmedNames[(string) $entry['workspace_id']] ?? '') !== $entry['title']) {
                        throw ValidationException::withMessages(['trash' => 'Type each workspace name exactly to confirm deletion.']);
                    }
                    $workspaceIds[] = $entry['workspace_id'];
                }
                $nodes = $catalog->containedNodes($entry['key']);
                array_push($nodeIds, ...$nodes->keys()->all());
                foreach ($catalog->containedAttachments($entry['key'], $nodes) as $attachment) {
                    $attachmentIds[] = $attachment->id;
                    $storageKeys[] = $attachment->storage_key;
                }
            }
            // Unlink only the subtree being removed to satisfy the restrictive parent FK.
            Node::withTrashed()->whereIn('id', $nodeIds)->update(['parent_id' => null]);
            Attachment::withTrashed()->whereIn('id', $attachmentIds)->forceDelete();
            Node::withTrashed()->whereIn('id', $nodeIds)->forceDelete();
            $user->workspaces()->onlyTrashed()->whereIn('id', $workspaceIds)->forceDelete();

            return array_values(array_unique($storageKeys));
        });

        // Files are removed after commit so a database rollback cannot destroy recoverable content.
        try {
            $cleaned = Storage::disk('local')->delete($storageKeys);
        } catch (\Throwable $exception) {
            report($exception);
            $cleaned = false;
        }
        if (! $cleaned) {
            Log::warning('Trash records deleted, but attachment cleanup needs administrator attention.', ['storage_keys' => $storageKeys]);
        }

        return $cleaned;
    }

    private function lockAndReadCatalog(User $user): TrashCatalog
    {
        User::whereKey($user->id)->lockForUpdate()->firstOrFail();
        $user->workspaces()->withTrashed()->orderBy('id')->lockForUpdate()->get();

        return new TrashCatalog($user);
    }
}
