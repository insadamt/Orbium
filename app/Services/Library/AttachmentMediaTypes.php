<?php

namespace App\Services\Library;

final class AttachmentMediaTypes
{
    public const VIDEO = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    public const AUDIO = [
        'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm',
        'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/aac',
    ];

    public static function canPreview(string $mime): bool
    {
        return $mime === 'application/pdf' || in_array($mime, [...self::VIDEO, ...self::AUDIO], true);
    }
}
