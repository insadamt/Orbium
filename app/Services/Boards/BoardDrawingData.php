<?php

namespace App\Services\Boards;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final class BoardDrawingData
{
    public function validate(array $data): array
    {
        Validator::make(['data' => $data], [
            'data' => ['required', 'array:drawing,text_scale'],
            'data.text_scale' => ['sometimes', 'numeric', 'between:0.25,8'],
            'data.drawing' => ['required', 'array:points,breaks,view_width,view_height,color,stroke_width,opacity', 'required_array_keys:points,view_width,view_height,color,stroke_width,opacity'],
            'data.drawing.view_width' => ['required', 'numeric', 'between:1,4000'],
            'data.drawing.view_height' => ['required', 'numeric', 'between:1,4000'],
            'data.drawing.color' => ['required', 'string', 'regex:/\A(?:currentColor|#[0-9a-fA-F]{6})\z/'],
            'data.drawing.stroke_width' => ['required', 'numeric', 'between:1,48'],
            'data.drawing.opacity' => ['required', 'numeric', 'in:0.3,1'],
            'data.drawing.points' => ['required', 'array', 'list', 'min:1', 'max:6000'],
            'data.drawing.breaks' => ['sometimes', 'required', 'array', 'list', 'min:1', 'max:5999'],
            'data.drawing.breaks.*' => ['required', 'integer', 'min:1', 'max:5999'],
            'data.drawing.points.*' => ['required', 'array', 'list', 'size:2'],
        ])->validate();

        Validator::make(['points' => $data['drawing']['points']], [
            'points.*.0' => ['required', 'numeric', 'min:0', 'max:'.$data['drawing']['view_width']],
            'points.*.1' => ['required', 'numeric', 'min:0', 'max:'.$data['drawing']['view_height']],
        ])->validate();

        $previousBreak = 0;
        if (array_key_exists('breaks', $data['drawing'])) {
            foreach ($data['drawing']['breaks'] as $index) {
                $index = (int) $index;
                if ($index <= $previousBreak || $index >= count($data['drawing']['points'])) {
                    throw ValidationException::withMessages(['data.drawing.breaks' => 'Drawing gaps must be increasing indices inside the saved points.']);
                }
                $previousBreak = $index;
            }
        }

        //
        // Canonical numeric values keep client recovery validation consistent with persisted JSON.
        //
        $drawing = $data['drawing'];
        foreach (['view_width', 'view_height', 'stroke_width', 'opacity'] as $field) {
            $drawing[$field] = (float) $drawing[$field];
        }
        if (isset($drawing['breaks'])) {
            $drawing['breaks'] = array_map(fn ($index): int => (int) $index, $drawing['breaks']);
        }
        $drawing['points'] = array_map(fn (array $point): array => [(float) $point[0], (float) $point[1]], $drawing['points']);

        return ['drawing' => $drawing, ...(isset($data['text_scale']) ? ['text_scale' => (float) $data['text_scale']] : [])];
    }
}
