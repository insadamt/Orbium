<?php

namespace App\Services\Search;

use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class WorkspaceSearch
{
    public function search(Workspace $workspace, SearchQuery $query): array
    {
        $text = mb_strtolower($query->text);
        $prefix = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $text).'%';
        $recentOnly = $text === '' && $query->type === null && $query->tag === null && $query->container === null;
        $rows = DB::select(<<<'SQL'
            WITH RECURSIVE visible AS (
                SELECT id, parent_id, type, title, title::text AS path, ARRAY[id] AS ancestors
                FROM nodes WHERE workspace_id = ? AND deleted_at IS NULL AND parent_id IS NULL
                UNION ALL
                SELECT n.id, n.parent_id, n.type, n.title, v.path || ' / ' || n.title, v.ancestors || n.id
                FROM nodes n JOIN visible v ON n.parent_id = v.id
                WHERE n.workspace_id = ? AND n.deleted_at IS NULL
            ), matches AS (
                SELECT v.*, d.plain_text, parent.type AS parent_type,
                    CASE
                        WHEN ? = '' THEN 5
                        WHEN lower(v.title) = ? THEN 0
                        WHEN lower(v.title) LIKE ? ESCAPE '!' THEN 1
                        WHEN similarity(lower(v.title), ?) >= 0.2 THEN 2
                        WHEN EXISTS (
                            SELECT 1 FROM node_tag nt JOIN tags t ON t.id = nt.tag_id
                            WHERE nt.node_id = v.id AND t.workspace_id = ?
                            AND (lower(t.name) = ? OR similarity(lower(t.name), ?) >= 0.3)
                        ) OR EXISTS (
                            SELECT 1 FROM database_values dv JOIN database_properties dp ON dp.id = dv.property_id
                            WHERE dv.document_node_id = v.id AND dp.database_node_id = v.parent_id
                            AND dp.type IN ('text', 'number', 'select', 'multi_select', 'date', 'url', 'email')
                            AND to_tsvector('simple', dv.value::text) @@ plainto_tsquery('simple', ?)
                        ) THEN 3
                        WHEN to_tsvector('simple', d.plain_text) @@ plainto_tsquery('simple', ?) THEN 4
                        ELSE 9
                    END AS tier,
                    similarity(lower(v.title), ?) AS similarity
                FROM visible v LEFT JOIN documents d ON d.node_id = v.id
                LEFT JOIN nodes parent ON parent.id = v.parent_id
                WHERE (?::text IS NULL OR v.type = ?)
                AND (?::text IS NULL OR EXISTS (
                    SELECT 1 FROM node_tag nt JOIN tags t ON t.id = nt.tag_id
                    WHERE nt.node_id = v.id AND t.workspace_id = ? AND lower(t.name) = lower(?)
                ))
                AND (?::text IS NULL OR EXISTS (
                    SELECT 1 FROM visible p WHERE p.type = 'folder' AND lower(p.title) = lower(?)
                    AND p.id = ANY(v.ancestors) AND p.id <> v.id
                ))
            )
            SELECT *, CASE WHEN tier = 4 THEN
                ts_headline('simple', plain_text, plainto_tsquery('simple', ?),
                    'StartSel="«", StopSel="»", MaxWords=28, MinWords=10') ELSE '' END AS snippet
            FROM matches WHERE tier < 9 AND (?::integer = 0 OR id = ANY(?::bigint[]))
            ORDER BY tier,
                CASE WHEN parent_id IS NOT DISTINCT FROM ?::bigint THEN 0 ELSE 1 END,
                coalesce(array_position(?::bigint[], id), 1000),
                similarity DESC, lower(title), id
            LIMIT 60
            SQL, [
            $workspace->id, $workspace->id, $text, $text, $prefix, $text,
            $workspace->id, $text, $text, $text, $text, $text,
            $query->type, $query->type, $query->tag, $workspace->id, $query->tag,
            $query->container, $query->container, $text, $recentOnly ? 1 : 0,
            '{'.implode(',', $query->recentIds).'}', $query->parentId,
            '{'.implode(',', $query->recentIds).'}',
        ]);

        $results = array_map(fn ($row) => [
            'id' => $row->id, 'parent_id' => $row->parent_id, 'title' => $row->title,
            'type' => $row->type, 'label' => $row->type === 'document' && $row->parent_type === 'database' ? 'Database document' : ucfirst($row->type), 'path' => $row->path, 'snippet' => $row->snippet,
            'match' => ['Exact title', 'Title prefix', 'Similar title', 'Tag / property', 'Content', 'Recent'][$row->tier],
            'find' => $row->tier === 4 ? $query->text : null,
            'url' => route('nodes.show', [$workspace, $row->id], false),
        ], $rows);

        $tags = $text === '' ? [] : DB::table('tags')
            ->join('node_tag', 'node_tag.tag_id', '=', 'tags.id')
            ->where('tags.workspace_id', $workspace->id)
            ->whereIn('node_tag.node_id', array_column($rows, 'id'))
            ->whereRaw("(lower(tags.name) LIKE ? ESCAPE '!' OR similarity(lower(tags.name), ?) >= 0.3)", [$prefix, $text])
            ->distinct()->orderBy('tags.name')->limit(10)->pluck('tags.name')->all();

        return ['results' => $results, 'tags' => $tags];
    }
}
