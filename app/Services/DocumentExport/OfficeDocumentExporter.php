<?php

namespace App\Services\DocumentExport;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

final class OfficeDocumentExporter
{
    /**
     * @param  array<string, mixed>  $model
     * @param  list<array{hash: string, png: string}>  $diagrams
     * @param  array<string, string>  $expectedDiagrams
     */
    public function generate(array $model, OfficeExportOptions $options, array $diagrams, array $expectedDiagrams): string
    {
        $directory = storage_path('app/private/document-exports/'.Str::uuid());
        File::ensureDirectoryExists($directory, 0700);
        try {
            $remainingBytes = (int) config('document-export.max_media_bytes');
            $imagePaths = [];
            $this->stageImages($model, $directory, $remainingBytes, $imagePaths);
            $diagramPaths = $this->stageDiagrams($diagrams, $expectedDiagrams, $directory, $remainingBytes);
            File::put($directory.'/input.json', json_encode([...$options->toRendererInput(), 'body' => $model, 'diagrams' => $diagramPaths], JSON_THROW_ON_ERROR));
            $this->runRenderer([(string) config('document-export.node_binary'), '--max-old-space-size=256', base_path('scripts/document-export/generate.mjs'), $directory.'/input.json', $directory.'/document.docx']);
            $path = $directory.'/document.docx';
            if ($options->format === 'pdf') {
                $profile = 'file://'.str_replace('%2F', '/', rawurlencode($directory.'/profile'));
                $this->runRenderer([(string) config('document-export.libreoffice_binary'), '-env:UserInstallation='.$profile, '--headless', '--nologo', '--nodefault', '--norestore', '--convert-to', 'pdf:writer_pdf_Export', '--outdir', $directory, $path]);
                $path = $directory.'/document.pdf';
            }
            if (! is_file($path) || filesize($path) === 0) {
                throw ValidationException::withMessages(['format' => 'The document could not be generated. Check the server export dependencies and try again.']);
            }

            return $path;
        } catch (\Throwable $failure) {
            File::deleteDirectory($directory);
            throw $failure;
        }
    }

    /** @param list<string> $command */
    private function runRenderer(array $command): void
    {
        $process = new Process($command, base_path(), null, null, (int) config('document-export.timeout_seconds'));
        try {
            $process->run();
        } catch (ProcessTimedOutException) {
            throw ValidationException::withMessages(['format' => 'Export took too long. Try a smaller document or fewer images.']);
        }
        if (! $process->isSuccessful()) {
            // Renderer output may include private document content; do not expose or log it.
            throw ValidationException::withMessages(['format' => 'Export could not be generated. Check the server export dependencies and the document’s images and equations.']);
        }
    }

    /**
     * @param  array<string, mixed>  $model
     * @param  array<string, string>  $imagePaths
     */
    private function stageImages(array &$model, string $directory, int &$remainingBytes, array &$imagePaths): void
    {
        if (isset($model['path'])) {
            $source = (string) $model['path'];
            if (! isset($imagePaths[$source])) {
                $size = filesize($source);
                if ($size === false || $size > $remainingBytes) {
                    throw ValidationException::withMessages(['source' => 'Document export supports up to 30 MiB of images and diagrams.']);
                }
                $remainingBytes -= $size;
                $target = $directory.'/image-'.Str::uuid();
                File::copy($source, $target);
                $imagePaths[$source] = $target;
            }
            $model['path'] = $imagePaths[$source];
            unset($model['bytes']);
        }
        foreach ($model['children'] ?? [] as $index => $child) {
            $this->stageImages($child, $directory, $remainingBytes, $imagePaths);
            $model['children'][$index] = $child;
        }
    }

    /**
     * @param  list<array{hash: string, png: string}>  $diagrams
     * @param  array<string, string>  $expected
     * @return array<string, string>
     */
    private function stageDiagrams(array $diagrams, array $expected, string $directory, int &$remainingBytes): array
    {
        if (count($expected) > 100) {
            throw ValidationException::withMessages(['source' => 'Document export supports up to 100 distinct diagrams.']);
        }
        $paths = [];
        foreach ($diagrams as $diagram) {
            if (! isset($expected[$diagram['hash']]) || isset($paths[$diagram['hash']])) {
                throw ValidationException::withMessages(['diagrams' => 'Export diagrams must match the current document.']);
            }
            $bytes = base64_decode($diagram['png'], true);
            $dimensions = $bytes === false ? false : @getimagesizefromstring($bytes);
            if ($bytes === false || ! str_starts_with($bytes, "\x89PNG\r\n\x1a\n") || $dimensions === false
                || $dimensions[2] !== IMAGETYPE_PNG || $dimensions[0] > 4096 || $dimensions[1] > 4096
                || strlen($bytes) > $remainingBytes) {
                throw ValidationException::withMessages(['diagrams' => 'A diagram image is invalid or exceeds the export limits.']);
            }
            $remainingBytes -= strlen($bytes);
            $path = $directory.'/diagram-'.$diagram['hash'].'.png';
            File::put($path, $bytes);
            $paths[$diagram['hash']] = $path;
        }
        if (count($paths) !== count($expected)) {
            throw ValidationException::withMessages(['diagrams' => 'A diagram is missing. Reopen Export and try again.']);
        }

        return $paths;
    }
}
