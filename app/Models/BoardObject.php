<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class BoardObject extends Model
{
    protected function casts(): array
    {
        return ['data' => 'array', 'x' => 'float', 'y' => 'float', 'width' => 'float', 'height' => 'float', 'layer' => 'integer', 'content_format_version' => 'integer'];
    }
}
