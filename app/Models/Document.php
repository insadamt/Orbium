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

    protected $fillable = ['content', 'markdown', 'content_format_version', 'plain_text', 'cover_attachment_id', 'cover_aspect_ratio', 'icon_attachment_id', 'revision',
        'word_count', 'character_count', 'character_count_without_spaces', 'block_counts', 'checked_checklist_count', 'inline_math_count', 'body_attachment_ids', 'statistics_version'];

    protected function casts(): array
    {
        return ['content' => 'array', 'content_format_version' => 'integer', 'revision' => 'integer',
            'word_count' => 'integer', 'character_count' => 'integer', 'character_count_without_spaces' => 'integer',
            'block_counts' => 'array', 'checked_checklist_count' => 'integer', 'inline_math_count' => 'integer',
            'body_attachment_ids' => 'array', 'statistics_version' => 'integer'];
    }

    /** @return BelongsTo<Node, $this> */
    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'node_id');
    }
}
