<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $primaryKey = 'node_id';

    public $incrementing = false;

    protected $fillable = ['content', 'content_format_version', 'plain_text', 'cover_attachment_id', 'cover_aspect_ratio', 'icon_attachment_id', 'revision'];

    protected function casts(): array
    {
        return ['content' => 'array', 'revision' => 'integer'];
    }

    /** @return BelongsTo<Node, $this> */
    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'node_id');
    }
}
