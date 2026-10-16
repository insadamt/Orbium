<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Node;
use App\Services\Library\AttachmentMediaTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttachmentController extends Controller
{
    public function storeLibraryFile(Request $request, int $workspace): JsonResponse
    {
        $request->user()->workspaces()->findOrFail($workspace);
        $data = $request->validate(['file' => ['required', 'file', 'max:'.(config('uploads.max_attachment_mb') * 1024)]]);

        return $this->persistAttachment($workspace, null, $data['file']);
    }

    public function showLibraryFile(Request $request, int $workspace, int $attachment): BinaryFileResponse
    {
        $request->user()->workspaces()->findOrFail($workspace);

        if ($request->boolean('download')) {
            $file = Attachment::query()->where('workspace_id', $workspace)->findOrFail($attachment);
            abort_unless(Storage::disk('local')->exists($file->storage_key), 404);

            return response()->download(Storage::disk('local')->path($file->storage_key), $file->original_name, ['X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'", 'Cache-Control' => 'no-store'])->setPrivate();
        }

        return $this->serveAttachment($workspace, $attachment, false);
    }

    public function store(Request $request, int $workspace, int $node): JsonResponse
    {
        $documentNode = $request->user()->workspaces()->findOrFail($workspace)
            ->nodes()->where('type', 'document')->findOrFail($node);
        $this->assertVisible($documentNode);
        $data = $request->validate(['file' => ['required', 'file', 'max:'.(config('uploads.max_attachment_mb') * 1024)]]);

        return $this->persistAttachment($workspace, $node, $data['file']);
    }

    public function storeNodeImage(Request $request, int $workspace, int $node): JsonResponse
    {
        $container = $request->user()->workspaces()->findOrFail($workspace)
            ->nodes()->whereIn('type', ['folder', 'database'])->findOrFail($node);
        $this->assertVisible($container);
        $data = $request->validate(['file' => ['required', 'file', 'mimetypes:image/png,image/jpeg,image/gif,image/webp', 'max:10240']]);

        return $this->persistAttachment($workspace, $node, $data['file']);
    }

    private function persistAttachment(int $workspace, ?int $node, UploadedFile $file): JsonResponse
    {
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $isImage = in_array($mime, ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true);
        $originalName = preg_replace('/[^\pL\pN ._()-]/u', '_', mb_substr($file->getClientOriginalName(), 0, 255)) ?: 'attachment';
        $storageKey = 'attachments/'.$workspace.'/'.Str::uuid()->toString();
        $storedPath = Storage::disk('local')->putFileAs('attachments/'.$workspace, $file, basename($storageKey));
        abort_if($storedPath === false, 500, 'The file could not be stored.');

        try {
            $attachment = Attachment::query()->create([
                'workspace_id' => $workspace,
                'owner_node_id' => $node,
                'purpose' => $isImage ? 'image' : 'document',
                'original_name' => $originalName,
                'mime_type' => $mime,
                'size_bytes' => $file->getSize(),
                'sha256' => hash_file('sha256', $file->getRealPath()),
                'storage_key' => $storageKey,
            ]);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($storageKey);
            throw $error;
        }

        return response()->json([
            'id' => $attachment->id,
            'name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'size_bytes' => $attachment->size_bytes,
            'url' => route('library.files.show', [$workspace, $attachment]),
        ], 201);
    }

    public function show(Request $request, int $workspace, int $node, int $attachment): BinaryFileResponse
    {
        $documentNode = $request->user()->workspaces()->findOrFail($workspace)
            ->nodes()->where('type', 'document')->findOrFail($node);
        $this->assertVisible($documentNode);

        return $this->serveAttachment($workspace, $attachment, false, $request->boolean('download'));
    }

    public function metadata(Request $request, int $workspace, int $node, int $attachment): JsonResponse
    {
        $documentNode = $request->user()->workspaces()->findOrFail($workspace)
            ->nodes()->where('type', 'document')->findOrFail($node);
        $this->assertVisible($documentNode);
        $file = Attachment::query()->where('workspace_id', $workspace)
            ->findOrFail($attachment);

        abort_unless(Storage::disk('local')->exists($file->storage_key), 404);

        return response()->json([
            'id' => $file->id,
            'name' => $file->original_name,
            'mime_type' => $file->mime_type,
            'size_bytes' => $file->size_bytes,
            'purpose' => $file->purpose,
        ]);
    }

    public function showNodeImage(Request $request, int $workspace, int $node, int $attachment): BinaryFileResponse
    {
        $container = $request->user()->workspaces()->findOrFail($workspace)
            ->nodes()->whereIn('type', ['folder', 'database'])->findOrFail($node);
        $this->assertVisible($container);

        return $this->serveAttachment($workspace, $attachment, true);
    }

    private function serveAttachment(int $workspace, int $attachment, bool $imageOnly, bool $download = false): BinaryFileResponse
    {
        $file = Attachment::query()->where('workspace_id', $workspace)->findOrFail($attachment);
        abort_if($imageOnly && $file->purpose !== 'image', 404);
        $path = Storage::disk('local')->path($file->storage_key);
        abort_unless(is_file($path), 404);

        $headers = [
            'Cache-Control' => 'no-cache',
            'Content-Type' => $file->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'",
        ];

        if (! $download && (in_array($file->mime_type, ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true) || AttachmentMediaTypes::canPreview($file->mime_type))) {
            return response()->file($path, $headers)->setContentDisposition('inline', $file->original_name)->setPrivate();
        }

        return response()->download($path, $file->original_name, $headers)->setPrivate();
    }

    private function assertVisible(Node $node): void
    {
        $ancestor = $node;
        while ($ancestor->parent_id !== null) {
            $ancestor = $node->workspace->nodes()->findOrFail($ancestor->parent_id);
        }
    }
}
