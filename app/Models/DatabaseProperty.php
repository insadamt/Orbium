<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DatabaseProperty extends Model
{
    protected $fillable = ['database_node_id', 'name', 'type', 'position', 'config'];

    protected function casts(): array
    {
        return ['config' => 'array'];
    }

    public function database(): BelongsTo
    {
        return $this->belongsTo(Database::class, 'database_node_id', 'node_id');
    }
}
