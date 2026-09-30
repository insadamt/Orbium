<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DatabaseValue extends Model
{
    protected $fillable = ['document_node_id', 'property_id', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }
}
