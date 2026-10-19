<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Board extends Model
{
    protected $primaryKey = 'node_id';

    public $incrementing = false;

    protected $fillable = ['format_version', 'revision'];

    protected function casts(): array
    {
        return ['format_version' => 'integer', 'revision' => 'integer'];
    }

    /** @return HasMany<BoardObject, $this> */
    public function objects(): HasMany
    {
        return $this->hasMany(BoardObject::class, 'board_node_id', 'node_id');
    }
}
