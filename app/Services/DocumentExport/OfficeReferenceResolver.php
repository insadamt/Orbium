<?php

namespace App\Services\DocumentExport;

use App\Models\Node;
use App\Models\Workspace;
use App\Services\References\OwnedReferenceAvailability;
use Illuminate\Support\Facades\Storage;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;

final class OfficeReferenceResolver
{
    /** @return array<string, mixed> */
    public function resolve(Image|Link $reference, Workspace $workspace, Node $document): array
    {
        $url = $reference->getUrl();
        $image = $reference instanceof Image;
        $result = ['kind' => $image ? 'image' : 'link', 'url' => '', 'missing' => true];
        if (preg_match('~^orbium:(node|attachment)/([1-9][0-9]*)$~D', $url, $match)) {
            $availability = app(OwnedReferenceAvailability::class);
            $id = (int) $match[2];
            if ($match[1] === 'node') {
                if ($availability->findNode($workspace, $id) !== null) {
                    $result['url'] = url("workspaces/{$workspace->id}/nodes/{$id}");
                    $result['missing'] = false;
                }
            } elseif (($file = $availability->findAttachment($workspace, $document->id, $id)) !== null) {
                $result['url'] = url("workspaces/{$workspace->id}/documents/{$document->id}/attachments/{$id}");
                $result['missing'] = false;
                if ($image) {
                    $result['path'] = Storage::disk('local')->path($file->storage_key);
                    $result['bytes'] = $file->size_bytes;
                }
            }
        } elseif (! $image && preg_match('~^(https?://|mailto:)~i', $url)) {
            $result['url'] = $url;
            $result['missing'] = false;
        } elseif (! $image && ! str_starts_with($url, '#orbium-missing-')) {
            // Relative destinations have no reliable document target outside Orbium.
            $result['missing'] = false;
        }

        return $result;
    }
}
