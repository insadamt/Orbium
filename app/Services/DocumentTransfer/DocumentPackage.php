<?php

namespace App\Services\DocumentTransfer;

use App\Actions\Documents\SaveMarkdownDocument;
use App\Actions\Nodes\ManageHierarchy;
use App\Models\Attachment;
use App\Models\Workspace;
use App\Services\Markdown\MarkdownDocumentInspector;
use App\Services\Markdown\MarkdownReferenceRemapper;
use App\Services\Markdown\MarkdownReferenceValidator;
use App\Services\Markdown\MarkdownSaveData;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

final class DocumentPackage
{
    /** @param array<string, mixed> $data */
    public function export(Workspace $workspace, array $data): string
    {
        $path = tempnam(sys_get_temp_dir(), 'orbium-export-');
        $zip = new ZipArchive;
        $zipOpen = false;
        $this->ensure($zip->open($path, ZipArchive::OVERWRITE) === true, 'Could not create package.');
        $zipOpen = true;
        try {
            $documents = [];
            $assets = [];
            $includedNodes = array_column($data['documents'], 'id');
            foreach ($data['documents'] as $row) {
                $node = $workspace->nodes()->where('type', 'document')->whereKey($row['id'])->firstOrFail();
                $inspection = app(MarkdownDocumentInspector::class)->inspect($row['source']);
                app(MarkdownReferenceValidator::class)->validate($node, $inspection);
                $nodeDestinations = [];
                $attachmentDestinations = [];
                $excludedAssets = [];
                foreach (array_keys($inspection->derived->mentions) as $id) {
                    if (! in_array($id, $includedNodes, true)) {
                        $nodeDestinations[$id] = url('/workspaces/'.$workspace->id.'/nodes/'.$id);
                    }
                }
                foreach ($inspection->derived->attachmentIds as $id) {
                    if (! in_array($id, $data['attachment_ids'], true)) {
                        $attachmentDestinations[$id] = url('/workspaces/'.$workspace->id.'/documents/'.$node->id.'/attachments/'.$id);
                        $excludedAssets[] = $id;
                    }
                }
                $serializer = app(DocumentMarkdownSerializer::class);
                $native = $data['format'] === 'orbie';
                $source = $serializer->serialize($row['source'], new TransferSerializationOptions($native, $nodeDestinations, $attachmentDestinations, $excludedAssets));
                $body = $source;
                if (! $native) {
                    foreach ($includedNodes as $id) {
                        $nodeDestinations[$id] = $id.'.md';
                    }
                    foreach ($data['attachment_ids'] as $id) {
                        $attachmentDestinations[$id] = '../assets/'.$id;
                    }
                    $body = $serializer->serialize($row['source'], new TransferSerializationOptions(false, $nodeDestinations, $attachmentDestinations, $excludedAssets));
                } else {
                    $body = '<!-- orbium-document '.json_encode(['version' => 1, 'title' => $node->title], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)." -->\n".$body;
                }
                $entry = 'documents/'.$node->id.'.'.$data['format'];
                $zip->addFromString($entry, $body);
                $documents[] = ['id' => $node->id, 'title' => $node->title, 'source' => $source, 'path' => $entry, 'sha256' => hash('sha256', $body)];
                foreach (Attachment::query()->where('workspace_id', $workspace->id)->where('owner_node_id', $node->id)->whereIn('id', array_intersect($inspection->derived->attachmentIds, $data['attachment_ids']))->get() as $file) {
                    $binary = Storage::disk('local')->path($file->storage_key);
                    $this->ensure(is_file($binary) && hash_file('sha256', $binary) === $file->sha256, 'An attachment is missing or damaged.');
                    $entry = 'assets/'.$file->id;
                    $zip->addFile($binary, $entry);
                    $assets[] = ['id' => $file->id, 'owner' => $node->id, 'path' => $entry, 'name' => $file->original_name, 'sha256' => $file->sha256];
                }
            }
            $zip->addFromString('manifest.json', json_encode(['kind' => 'orbium-document-package', 'version' => 1, 'documents' => $documents, 'assets' => $assets], JSON_THROW_ON_ERROR));
            $closed = $zip->close();
            $zipOpen = false;
            $this->ensure($closed, 'Could not finish package.');
            $this->verify(new UploadedFile($path, 'export.zip', test: true));

            return $path;
        } catch (\Throwable $failure) {
            if ($zipOpen) {
                @$zip->close();
            }
            @unlink($path);
            throw $failure;
        }
    }

    /** @return array<string, mixed> */
    public function verify(UploadedFile $file): array
    {
        $zip = new ZipArchive;
        $this->ensure($zip->open($file->getRealPath()) === true, 'Choose a valid Orbium document ZIP package.');
        try {
            $this->ensure($zip->numFiles <= 500, 'The package contains too many entries.');
            $entries = [];
            $total = 0;
            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);
                if ($stat === false) {
                    throw ValidationException::withMessages(['file' => 'Could not read package entry metadata.']);
                }
                $name = $stat['name'];
                $this->ensure($name === 'manifest.json' || preg_match('~^(documents/[1-9][0-9]*\.(md|orbie)|assets/[1-9][0-9]*)$~D', $name), 'The package contains an unsafe or unexpected path.');
                $zip->getExternalAttributesIndex($index, $system, $attributes);
                $this->ensure(($attributes >> 16 & 0170000) !== 0120000 && ! isset($entries[$name]), 'Duplicate entries and symbolic links are not allowed.');
                $limit = str_starts_with($name, 'assets/') ? 100 * 1024 * 1024 : ($name === 'manifest.json' ? 8 * 1024 * 1024 : 2 * 1024 * 1024 + 4096);
                $total += $stat['size'];
                $this->ensure($stat['size'] <= $limit && $total <= 100 * 1024 * 1024, 'The package exceeds import size limits.');
                $entries[$name] = true;
            }
            $this->ensure(isset($entries['manifest.json']), 'The package manifest is missing.');
            try {
                $manifest = json_decode($this->readEntry($zip, 'manifest.json', 8 * 1024 * 1024), true, 32, JSON_THROW_ON_ERROR);
            } catch (\Throwable) {
                throw ValidationException::withMessages(['file' => 'The package manifest is invalid.']);
            }
            $this->ensure(is_array($manifest), 'The package manifest must be an object.');
            $this->ensure(array_diff(array_keys($manifest), ['kind', 'version', 'documents', 'assets']) === [], 'The manifest contains unsupported fields.');
            Validator::make($manifest, [
                'kind' => ['required', 'in:orbium-document-package'], 'version' => ['required', 'integer', 'in:1'],
                'documents' => ['required', 'array', 'min:1', 'max:101'], 'documents.*' => ['array:id,title,source,path,sha256'], 'documents.*.id' => ['required', 'integer', 'min:1', 'distinct'],
                'documents.*.title' => ['required', 'string', 'max:255'], 'documents.*.source' => ['present', 'string', 'max:2097152'],
                'documents.*.path' => ['required', 'string', 'distinct'], 'documents.*.sha256' => ['required', 'regex:/^[a-f0-9]{64}$/'],
                'assets' => ['present', 'array', 'max:398'], 'assets.*' => ['array:id,owner,name,path,sha256'], 'assets.*.id' => ['required', 'integer', 'min:1', 'distinct'], 'assets.*.owner' => ['required', 'integer'],
                'assets.*.name' => ['required', 'string', 'max:255'], 'assets.*.path' => ['required', 'string', 'distinct'], 'assets.*.sha256' => ['required', 'regex:/^[a-f0-9]{64}$/'],
            ])->validate();
            $declared = ['manifest.json'];
            $actualExpandedBytes = strlen($this->readEntry($zip, 'manifest.json', 8 * 1024 * 1024));
            $owners = array_column($manifest['documents'], 'id');
            foreach (['documents', 'assets'] as $group) {
                foreach ($manifest[$group] as &$row) {
                    $this->ensure(is_int($row['id']) && ($group !== 'assets' || is_int($row['owner'])), 'Package relationship keys must be JSON integers.');
                    $expected = $group === 'assets' ? 'assets/'.$row['id'] : 'documents/'.$row['id'].'.';
                    $this->ensure($group === 'assets' ? $row['path'] === $expected : in_array($row['path'], [$expected.'md', $expected.'orbie'], true), 'An entry has an invalid declared path.');
                    $this->ensure(isset($entries[$row['path']]), 'A declared entry is missing.');
                    $declared[] = $row['path'];
                    if ($group === 'assets') {
                        $this->ensure(in_array($row['owner'], $owners, true), 'An attachment has no owning document.');
                        $stream = $zip->getStream($row['path']);
                        if ($stream === false) {
                            throw ValidationException::withMessages(['file' => 'An attachment could not be read.']);
                        }
                        try {
                            $digest = hash_init('sha256');
                            $size = 0;
                            $prefix = '';
                            while (! feof($stream)) {
                                $chunk = fread($stream, 65536);
                                if ($chunk === false) {
                                    throw ValidationException::withMessages(['file' => 'An attachment is damaged.']);
                                }
                                if ($prefix === '') {
                                    $prefix = $chunk;
                                }
                                $size += strlen($chunk);
                                $actualExpandedBytes += strlen($chunk);
                                $this->ensure($actualExpandedBytes <= 100 * 1024 * 1024, 'The expanded package exceeds import size limits.');
                                $this->ensure($size <= 100 * 1024 * 1024, 'An expanded attachment exceeds import size limits.');
                                hash_update($digest, $chunk);
                            }
                            $this->ensure(hash_final($digest) === $row['sha256'], 'Attachment checksum verification failed.');
                            $row['mime'] = (new \finfo(FILEINFO_MIME_TYPE))->buffer($prefix) ?: 'application/octet-stream';
                            $row['size'] = $size;
                        } finally {
                            fclose($stream);
                        }
                    } else {
                        $content = $this->readEntry($zip, $row['path'], 2 * 1024 * 1024 + 4096);
                        $actualExpandedBytes += strlen($content);
                        $this->ensure($actualExpandedBytes <= 100 * 1024 * 1024, 'The expanded package exceeds import size limits.');
                        $this->ensure(hash('sha256', $content) === $row['sha256'], 'Document checksum verification failed.');
                        app(DocumentPackageContent::class)->validate($row, $content, $manifest['documents']);
                    }
                }
            }
            unset($row);
            sort($declared);
            $actual = array_keys($entries);
            sort($actual);
            $this->ensure($declared === $actual, 'The package contains undeclared entries.');
            foreach ($manifest['documents'] as $row) {
                $inspection = app(MarkdownDocumentInspector::class)->inspect($row['source']);
                $this->ensure(array_diff(array_keys($inspection->derived->mentions), $owners) === [], 'A document reference is missing from the package.');
                $assetIds = array_column(array_filter($manifest['assets'], fn ($asset) => $asset['owner'] === $row['id']), 'id');
                $this->ensure(array_diff($inspection->derived->attachmentIds, $assetIds) === [], 'An attachment reference is missing from the package.');
                if ($inspection->derived->mentions !== [] || $inspection->derived->attachmentIds !== []) {
                    $identityNodes = array_combine($owners, $owners);
                    $identityAssets = array_combine($assetIds, $assetIds);
                    app(MarkdownReferenceRemapper::class)->remap($row['source'], $identityNodes, $identityAssets);
                }
                foreach ($inspection->attachmentReferences as $reference) {
                    if (! $reference->isImage) {
                        continue;
                    }
                    $asset = array_find($manifest['assets'], fn ($asset) => $asset['id'] === $reference->id);
                    $this->ensure($asset !== null && in_array($asset['mime'], ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true), 'An image entry is not a supported image.');
                }
            }

            $manifest['archive_path'] = $file->getRealPath();

            return $manifest;
        } finally {
            $zip->close();
        }
    }

    /**
     * @param  array<string, mixed>  $package
     * @param  \Closure(string): void|null  $progress
     * @return array{node_id: int, documents: int, assets: int}
     */
    public function import(Workspace $workspace, ?int $parentId, array $package, ?\Closure $progress = null): array
    {
        $writtenKeys = [];
        $zip = new ZipArchive;
        $this->ensure($zip->open($package['archive_path']) === true, 'Could not reopen the verified package.');
        try {
            return DB::transaction(function () use ($workspace, $parentId, $package, $zip, $progress, &$writtenKeys) {
                $nodeIds = [];
                $attachmentIds = [];
                $progress?->__invoke('Creating documents');
                foreach ($package['documents'] as $row) {
                    $node = app(ManageHierarchy::class)->create($workspace, 'document', $row['title'], $parentId);
                    $nodeIds[$row['id']] = $node->id;
                    $progress?->__invoke('Creating documents · '.count($nodeIds).' of '.count($package['documents']));
                }
                $progress?->__invoke('Importing images and files');
                foreach ($package['assets'] as $asset) {
                    $key = 'attachments/'.$workspace->id.'/'.Str::uuid();
                    $writtenKeys[] = $key;
                    $stream = $zip->getStream($asset['path']);
                    if ($stream === false) {
                        throw ValidationException::withMessages(['file' => 'Could not read an imported attachment.']);
                    }
                    try {
                        $this->ensure(Storage::disk('local')->put($key, $stream) !== false, 'Could not store an imported attachment.');
                    } finally {
                        fclose($stream);
                    }
                    $mime = $asset['mime'];
                    $attachment = Attachment::query()->create(['workspace_id' => $workspace->id, 'owner_node_id' => $nodeIds[$asset['owner']],
                        'purpose' => in_array($mime, ['image/png', 'image/jpeg', 'image/gif', 'image/webp']) ? 'image' : 'document',
                        'original_name' => preg_replace('/[^\pL\pN ._()-]/u', '_', $asset['name']) ?: 'attachment', 'mime_type' => $mime,
                        'size_bytes' => $asset['size'], 'sha256' => $asset['sha256'], 'storage_key' => $key]);
                    $attachmentIds[$asset['id']] = $attachment->id;
                    $progress?->__invoke('Importing images and files · '.count($attachmentIds).' of '.count($package['assets']));
                }
                $progress?->__invoke('Connecting references');
                foreach ($package['documents'] as $row) {
                    $inspection = app(MarkdownDocumentInspector::class)->inspect($row['source']);
                    $source = $inspection->derived->mentions === [] && $inspection->derived->attachmentIds === [] ? $row['source'] : app(MarkdownReferenceRemapper::class)->remap($row['source'], $nodeIds, $attachmentIds);
                    $node = $workspace->nodes()->whereKey($nodeIds[$row['id']])->firstOrFail();
                    app(SaveMarkdownDocument::class)->save($node, new MarkdownSaveData($source, 0, 2));
                }

                return ['node_id' => $nodeIds[$package['documents'][0]['id']], 'documents' => count($nodeIds), 'assets' => count($attachmentIds)];
            });
        } catch (\Throwable $failure) {
            Storage::disk('local')->delete($writtenKeys);
            throw $failure;
        } finally {
            $zip->close();
        }
    }

    private function readEntry(ZipArchive $zip, string $name, int $limit): string
    {
        $stream = $zip->getStream($name);
        if ($stream === false) {
            throw ValidationException::withMessages(['file' => 'A package entry could not be read.']);
        }
        try {
            $content = '';
            while (! feof($stream)) {
                $chunk = fread($stream, 65536);
                if ($chunk === false) {
                    throw ValidationException::withMessages(['file' => 'A package entry is damaged.']);
                }
                $content .= $chunk;
                $this->ensure(strlen($content) <= $limit, 'An expanded entry exceeds import size limits.');
            }

            return $content;
        } finally {
            fclose($stream);
        }
    }

    private function ensure(bool $condition, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages(['file' => $message]);
        }
    }
}
