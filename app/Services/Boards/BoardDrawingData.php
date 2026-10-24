<?php

namespace App\Services\Boards;

use Illuminate\Support\Facades\Validator;

final class BoardDrawingData
{
    public function validate(array $data): array
    {
        Validator::make(['data' => $data], [
            'data' => ['required', 'array:drawing,text_scale'],
            'data.text_scale' => ['sometimes', 'numeric', 'between:0.25,8'],
            'data.drawing' => ['required', 'array:points,view_width,view_height,color,stroke_width,opacity', 'required_array_keys:points,view_width,view_height,color,stroke_width,opacity'],
            'data.drawing.view_width' => ['required', 'numeric', 'between:1,4000'],
            'data.drawing.view_height' => ['required', 'numeric', 'between:1,4000'],
            'data.drawing.color' => ['required', 'string', 'regex:/\A(?:currentColor|#[0-9a-fA-F]{6})\z/'],
            'data.drawing.stroke_width' => ['required', 'numeric', 'between:1,48'],
            'data.drawing.opacity' => ['required', 'numeric', 'in:0.3,1'],
            'data.drawing.points' => ['required', 'array', 'list', 'min:1', 'max:6000'],
            'data.drawing.points.*' => ['required', 'array', 'list', 'size:2'],
        ])->validate();

        Validator::make(['points' => $data['drawing']['points']], [
            'points.*.0' => ['required', 'numeric', 'min:0', 'max:'.$data['drawing']['view_width']],
            'points.*.1' => ['required', 'numeric', 'min:0', 'max:'.$data['drawing']['view_height']],
        ])->validate();

        //
        // Canonical numeric values keep client recovery validation consistent with persisted JSON.
        //
        $drawing = $data['drawing'];
        foreach (['view_width', 'view_height', 'stroke_width', 'opacity'] as $field) {
            $drawing[$field] = (float) $drawing[$field];
        }
        $drawing['points'] = array_map(fn (array $point): array => [(float) $point[0], (float) $point[1]], $drawing['points']);

        return ['drawing' => $drawing, ...(isset($data['text_scale']) ? ['text_scale' => (float) $data['text_scale']] : [])];
    }
}
