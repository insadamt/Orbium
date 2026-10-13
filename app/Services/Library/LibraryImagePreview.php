<?php

namespace App\Services\Library;

use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;

final class LibraryImagePreview
{
    public const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

    public function dimensions(Attachment $file): ?array
    {
        if (! in_array($file->mime_type, self::IMAGE_TYPES, true)) {
            return null;
        }
        $path = Storage::disk('local')->path($file->storage_key);
        $size = is_file($path) ? @getimagesize($path) : false;

        if ($size === false || $size[0] < 1 || $size[1] < 1) {
            return null;
        }
        $rotated = in_array($this->jpegOrientation($file), [5, 6, 7, 8], true);

        return ['width' => $size[$rotated ? 1 : 0], 'height' => $size[$rotated ? 0 : 1]];
    }

    public function cacheKey(Attachment $file): string
    {
        return 'library-previews/'.$file->workspace_id.'/'.$file->id.'-'.$file->sha256.'.png';
    }

    public function createThumbnail(Attachment $file): ?string
    {
        $disk = Storage::disk('local');
        $key = $this->cacheKey($file);
        if ($disk->exists($key)) {
            return $disk->path($key);
        }
        $size = $this->dimensions($file);
        // Bound decoder memory and preserve animation; thumbnail support is optional on native installs.
        if ($size === null || $file->mime_type === 'image/gif' || $size['width'] * $size['height'] > 8000000
            || $file->size_bytes > 10 * 1024 * 1024 || ! function_exists('imagecreatefromstring')
            || ($file->mime_type === 'image/jpeg' && $this->jpegOrientation($file) !== 1)) {
            return null;
        }
        $scale = min(1, 640 / $size['width'], 1600 / $size['height']);
        if ($scale >= 1) {
            return null;
        }
        $source = @imagecreatefromstring($disk->get($file->storage_key));
        if ($source === false) {
            return null;
        }
        $target = imagecreatetruecolor(max(1, (int) round($size['width'] * $scale)), max(1, (int) round($size['height'] * $scale)));
        imagealphablending($target, false);
        imagesavealpha($target, true);
        imagecopyresampled($target, $source, 0, 0, 0, 0, imagesx($target), imagesy($target), $size['width'], $size['height']);
        ob_start();
        imagepng($target);
        $binary = ob_get_clean();
        imagedestroy($source);
        imagedestroy($target);
        if (! is_string($binary) || ! $disk->put($key, $binary)) {
            return null;
        }

        return $disk->path($key);
    }

    private function jpegOrientation(Attachment $file): ?int
    {
        if ($file->mime_type !== 'image/jpeg' || ! function_exists('exif_read_data')) {
            return null;
        }
        $path = Storage::disk('local')->path($file->storage_key);
        $data = is_file($path) ? @exif_read_data($path, 'IFD0') : false;

        return (int) ($data['Orientation'] ?? 1);
    }
}
