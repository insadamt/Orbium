<?php

// Summary: Validates native shape appearance before saving, using Laravel validation and BoardBlockData for label inlines.

namespace App\Services\Boards;

use Illuminate\Support\Facades\Validator;

final class BoardShapeData
{
    public function validate(array $data): array
    {
        $color = 'regex:/\A(?:currentColor|#[0-9a-fA-F]{6})\z/';
        Validator::make(['data' => $data], [
            'data' => ['required', 'array:shape,content,align,dir,text_scale', 'required_array_keys:shape,content'],
            'data.shape' => ['required', 'array:kind,fill,stroke,stroke_width,stroke_style,corner_radius', 'required_array_keys:kind,fill,stroke,stroke_width,stroke_style'],
            'data.shape.kind' => ['required', 'in:circle,rectangle,rounded_rectangle,ellipse,diamond,triangle,hexagon'],
            'data.shape.fill' => ['required', 'string', 'regex:/\A(?:none|currentColor|#[0-9a-fA-F]{6})\z/'],
            'data.shape.stroke' => ['required', 'string', $color],
            'data.shape.stroke_width' => ['required', 'numeric', 'between:1,12'],
            'data.shape.stroke_style' => ['required', 'in:solid,dashed'],
            'data.shape.corner_radius' => ['sometimes', 'numeric', 'between:0,50'],
            'data.content' => ['present', 'array', 'list'],
            'data.align' => ['sometimes', 'in:left,center,right'],
            'data.dir' => ['sometimes', 'in:auto,ltr,rtl'],
            'data.text_scale' => ['sometimes', 'numeric', 'between:0.25,8'],
        ])->validate();

        //
        // Normalize form numbers so the client sees the same typed shape after reload.
        //
        $data['shape']['stroke_width'] = (float) $data['shape']['stroke_width'];
        if (isset($data['shape']['corner_radius'])) {
            $data['shape']['corner_radius'] = (float) $data['shape']['corner_radius'];
        }
        if (isset($data['text_scale'])) {
            $data['text_scale'] = (float) $data['text_scale'];
        }

        return $data;
    }
}
