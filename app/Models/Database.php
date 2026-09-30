<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Database extends Model
{
    protected $primaryKey = 'node_id';

    public $incrementing = false;

    protected $fillable = ['node_id'];

    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'node_id');
    }

    public function properties(): HasMany
    {
        return $this->hasMany(DatabaseProperty::class, 'database_node_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(DatabaseViewSetting::class, 'database_node_id');
    }
}
