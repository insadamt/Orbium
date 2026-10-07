<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<string, mixed> $content
 * @property string|null $markdown
 */
class Document extends Model
{
    protected $primaryKey = 'node_id';

    public $incrementing = false;

    protected $fillable = ['content', 'markdown', 'content_format_version', 'plain_text', 'cover_attachment_id', 'cover_aspect_ratio', 'icon_attachment_id', 'revision'];

    protected function casts(): array
    {
        return ['content' => 'array', 'content_format_version' => 'integer', 'revision' => 'integer'];
    }

    /** @return BelongsTo<Node, $this> */
    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'node_id');
    }
}
