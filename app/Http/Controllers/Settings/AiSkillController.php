<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Skills\OrbiumSkillArchive;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class AiSkillController extends Controller
{
    public function download(OrbiumSkillArchive $archive): BinaryFileResponse
    {
        return response()->download($archive->create(), 'create-orbium-documents.zip', [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'private, no-store',
        ])->deleteFileAfterSend();
    }
}
