<?php

namespace App\Services\Boards;

final class BoardInlineIcons
{
    public function attachmentIds(array $data): array
    {
        $ids = [];
        $pending = [$data];
        while ($pending !== []) {
            $value = array_pop($pending);
            if (($value['type'] ?? null) === 'inlineIcon' && ($value['attrs']['kind'] ?? null) === 'custom') {
                $ids[] = $value['attrs']['attachmentId'];
            }
            foreach ($value as $key => $child) {
                //
                // Mind Map and canonical table references have their own validated discovery paths.
                //
                if (is_array($child) && $key !== 'mindmap') {
                    $pending[] = $child;
                }
            }
        }

        return array_values(array_unique($ids));
    }
}
