<?php

namespace App\Services\Boards;

final class BoardSaveRules
{
    /** @return array<string, list<string>> */
    public static function rules(): array
    {
        return [
            'format_version' => ['required', 'integer', 'in:5'],
            'revision' => ['required', 'integer', 'min:0', 'max:9007199254740990'],
            ...self::objects('objects'),
        ];
    }

    /** @return array<string, list<string>> */
    public static function objects(string $field): array
    {
        //
        // Payload byte budgets bound Board data without imposing a block-count ceiling.
        //
        return [
            $field => ['present', 'array', 'list'],
            "$field.*" => ['required', 'array:id,block_type,content_format_version,data,x,y,width,height,layer'],
            "$field.*.id" => ['required', 'uuid', 'distinct:ignore_case'],
            "$field.*.block_type" => ['required', 'in:'.implode(',', BoardBlockData::KINDS)],
            "$field.*.content_format_version" => ['required', 'integer', 'in:1'],
            "$field.*.data" => ['present', 'array'],
            "$field.*.x" => ['required', 'numeric', 'between:-10000000,10000000'],
            "$field.*.y" => ['required', 'numeric', 'between:-10000000,10000000'],
            "$field.*.width" => ['required', 'numeric', 'between:80,4000'],
            "$field.*.height" => ['required', 'numeric', 'between:32,4000'],
            "$field.*.layer" => ['required', 'integer', 'between:0,1000000'],
        ];
    }
}
