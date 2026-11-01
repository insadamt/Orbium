<?php

/**
 * Summary: Exposes the V3 structural parser for manual file review without application/database writes; depends on the native V3 codec, structural parser and bounded local file reads.
 */

namespace App\Console\Commands;

use App\Services\Markdown\V3\V3Contract;
use App\Services\Markdown\V3\V3DocumentFile;
use App\Services\Markdown\V3\V3StructureParser;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

final class InspectV3Document extends Command
{
    protected $signature = 'documents:inspect-v3 {path : Local native .orbie file, or a body with --body} {--body : Inspect canonical body source without a file envelope}';

    protected $description = 'Inspect V3 structure as JSON without importing or saving content';

    public function handle(V3DocumentFile $files, V3StructureParser $parser): int
    {
        $path = (string) $this->argument('path');
        $limit = V3Contract::definition()['limits']['sourceBytes'] + V3Contract::definition()['limits']['lineBytes'] + 1;
        //
        // A local inspector must not fetch URL wrappers or block on a named pipe/device.
        //
        if (str_contains($path, '://') || ! is_file($path) || ! is_readable($path)) {
            $this->error('Choose a readable local regular file.');

            return self::FAILURE;
        }
        $source = file_get_contents($path, false, null, 0, $limit + 1);
        if ($source === false || strlen($source) > $limit) {
            $this->error('The file could not be read within the V3 size limit.');

            return self::FAILURE;
        }
        try {
            $file = $this->option('body') ? null : $files->decode($source);
            $structure = $file?->structure ?? $parser->parse($source);
            $this->line(json_encode(['valid' => $structure->valid(), 'title' => $file?->title, 'structure' => $structure], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR));

            return $structure->valid() ? self::SUCCESS : self::FAILURE;
        } catch (InvalidArgumentException|ValidationException $error) {
            $errors = $error instanceof ValidationException ? $error->errors() : ['file' => [$error->getMessage()]];
            $this->line(json_encode(['valid' => false, 'errors' => $errors], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR));

            return self::FAILURE;
        }
    }
}
