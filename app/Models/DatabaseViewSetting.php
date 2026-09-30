<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DatabaseViewSetting extends Model
{
    protected $fillable = ['database_node_id', 'view_type', 'config'];

    protected function casts(): array
    {
        return ['config' => 'array'];
    }
}
