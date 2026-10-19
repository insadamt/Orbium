<?php

namespace App\Services\Boards;

final class BoardSaveRules
{
    public static function rules(): array
    {
        return [
            'format_version' => ['required', 'integer', 'in:4'],
            'revision' => ['required', 'integer', 'min:0', 'max:9007199254740990'],
            'objects' => ['present', 'array', 'list', 'max:'.BoardContent::MAX_OBJECTS],
            'objects.*' => ['required', 'array:id,block_type,content_format_version,data,x,y,width,height,layer'],
            'objects.*.id' => ['required', 'uuid', 'distinct:ignore_case'],
            'objects.*.block_type' => ['required', 'in:'.implode(',', BoardBlockData::KINDS)],
            'objects.*.content_format_version' => ['required', 'integer', 'in:1'],
            'objects.*.data' => ['present', 'array'],
            'objects.*.x' => ['required', 'numeric', 'between:-10000000,10000000'],
            'objects.*.y' => ['required', 'numeric', 'between:-10000000,10000000'],
            'objects.*.width' => ['required', 'numeric', 'between:80,4000'],
            'objects.*.height' => ['required', 'numeric', 'between:32,4000'],
            'objects.*.layer' => ['required', 'integer', 'between:0,1000000'],
        ];
    }
}
