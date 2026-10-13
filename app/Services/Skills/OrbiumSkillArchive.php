<?php

namespace App\Services\Skills;

use Illuminate\Support\Facades\File;
use RuntimeException;
use ZipArchive;

final class OrbiumSkillArchive
{
    public function create(): string
    {
        $archivePath = tempnam(sys_get_temp_dir(), 'orbium-skill-');
        if ($archivePath === false) {
            throw new RuntimeException('Could not allocate the skill download.');
        }

        $archive = new ZipArchive;
        $opened = false;
        try {
            if ($archive->open($archivePath, ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Could not create the skill ZIP.');
            }
            $opened = true;
            $skillDirectory = resource_path('skills/create-orbium-documents');
            foreach (File::allFiles($skillDirectory) as $file) {
                $entryPath = 'create-orbium-documents/'.$file->getRelativePathname();
                if ($file->isLink() || ! $archive->addFile($file->getPathname(), $entryPath)) {
                    throw new RuntimeException('Could not add a skill resource.');
                }
            }
            if (! $archive->close()) {
                throw new RuntimeException('Could not finish the skill ZIP.');
            }
            $opened = false;

            return $archivePath;
        } catch (\Throwable $failure) {
            if ($opened) {
                $archive->close();
            }
            File::delete($archivePath);

            throw $failure;
        }
    }
}
