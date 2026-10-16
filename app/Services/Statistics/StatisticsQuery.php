<?php

namespace App\Services\Statistics;

use App\Services\Library\LibraryImagePreview;
use Illuminate\Support\Facades\DB;

final class StatisticsQuery
{
    public function summary(StatisticsScope $scope): StatisticsSummary
    {
        $scopeSeed = $scope->nodeId === null ? 'SELECT * FROM visible_nodes' : 'SELECT * FROM visible_nodes WHERE id = ?';
        $scopeDescendants = $scope->nodeId === null ? '' : 'UNION SELECT child.* FROM visible_nodes child JOIN scoped_nodes parent ON child.parent_id = parent.id AND child.workspace_id = parent.workspace_id';
        $uploadSelection = $scope->nodeId === null
            ? 'SELECT a.* FROM attachments a JOIN workspaces w ON w.id = a.workspace_id WHERE w.user_id = ? AND a.deleted_at IS NULL AND (?::bigint IS NULL OR w.id = ?)'
            : 'SELECT a.* FROM attachments a JOIN referenced_uploads r ON r.id = a.id JOIN workspaces w ON w.id = a.workspace_id WHERE w.user_id = ? AND a.workspace_id = ? AND a.deleted_at IS NULL';
        $imageTypes = implode(',', array_fill(0, count(LibraryImagePreview::IMAGE_TYPES), '?'));
        $bindings = [$scope->userId, $scope->workspaceId, $scope->workspaceId];
        if ($scope->nodeId !== null) {
            $bindings[] = $scope->nodeId;
        }
        array_push($bindings, DocumentStatisticsData::VERSION);
        if ($scope->nodeId === null) {
            array_push($bindings, $scope->userId, $scope->workspaceId, $scope->workspaceId);
        } else {
            array_push($bindings, $scope->userId, $scope->workspaceId);
        }
        array_push($bindings, ...LibraryImagePreview::IMAGE_TYPES);
        array_push($bindings, $scope->userId, $scope->nodeId, $scope->nodeId);
        $row = DB::selectOne(<<<SQL
            WITH RECURSIVE visible_nodes AS (
                SELECT n.id, n.workspace_id, n.parent_id, n.type, n.cover_attachment_id, n.icon_attachment_id
                FROM nodes n JOIN workspaces w ON w.id = n.workspace_id
                WHERE n.parent_id IS NULL AND n.deleted_at IS NULL AND w.deleted_at IS NULL
                    AND w.user_id = ? AND (?::bigint IS NULL OR w.id = ?)
                UNION
                SELECT n.id, n.workspace_id, n.parent_id, n.type, n.cover_attachment_id, n.icon_attachment_id
                FROM nodes n JOIN visible_nodes parent ON n.parent_id = parent.id AND n.workspace_id = parent.workspace_id
                WHERE n.deleted_at IS NULL
            ), scoped_nodes AS (
                {$scopeSeed} {$scopeDescendants}
            ), scoped_documents AS (
                SELECT d.node_id, d.word_count, d.character_count, d.character_count_without_spaces,
                    d.block_counts, d.checked_checklist_count, d.inline_math_count, d.body_attachment_ids,
                    d.cover_attachment_id, d.icon_attachment_id, COALESCE(d.statistics_version = ?, false) AS complete
                FROM documents d JOIN scoped_nodes n ON n.id = d.node_id
            ), referenced_uploads AS (
                SELECT cover_attachment_id AS id FROM scoped_nodes WHERE cover_attachment_id IS NOT NULL
                UNION SELECT icon_attachment_id FROM scoped_nodes WHERE icon_attachment_id IS NOT NULL
                UNION SELECT cover_attachment_id FROM scoped_documents WHERE cover_attachment_id IS NOT NULL
                UNION SELECT icon_attachment_id FROM scoped_documents WHERE icon_attachment_id IS NOT NULL
                UNION SELECT body.id::bigint FROM scoped_documents d CROSS JOIN LATERAL jsonb_array_elements_text(d.body_attachment_ids) body(id)
                UNION SELECT files.id::bigint FROM database_values v
                    JOIN scoped_nodes n ON n.id = v.document_node_id
                    JOIN database_properties p ON p.id = v.property_id AND p.type = 'files' AND p.database_node_id = n.parent_id
                    CROSS JOIN LATERAL jsonb_array_elements_text(v.value) files(id)
            ), selected_uploads AS (
                {$uploadSelection}
            ), classified_uploads AS (
                SELECT size_bytes, mime_type IN ({$imageTypes}) AS is_image FROM selected_uploads
            ), block_totals AS (
                SELECT block.key, SUM(block.value::bigint) AS total
                FROM scoped_documents d CROSS JOIN LATERAL jsonb_each_text(d.block_counts) block
                WHERE d.complete GROUP BY block.key
            )
            SELECT
                (SELECT COUNT(*) FROM workspaces WHERE user_id = ? AND deleted_at IS NULL) AS workspaces,
                (SELECT COUNT(*) FROM scoped_nodes WHERE type = 'document') AS documents,
                (SELECT COUNT(*) FROM scoped_nodes WHERE type = 'folder' AND id != COALESCE(?::bigint, 0)) AS folders,
                (SELECT COUNT(*) FROM scoped_nodes WHERE type = 'database' AND id != COALESCE(?::bigint, 0)) AS databases,
                (SELECT COUNT(*) FROM scoped_nodes) AS scoped_node_count,
                (SELECT COUNT(*) FROM scoped_documents WHERE NOT complete) AS pending_documents,
                (SELECT COALESCE(SUM(word_count), 0) FROM scoped_documents WHERE complete) AS words,
                (SELECT COALESCE(SUM(character_count), 0) FROM scoped_documents WHERE complete) AS characters,
                (SELECT COALESCE(SUM(character_count_without_spaces), 0) FROM scoped_documents WHERE complete) AS characters_without_spaces,
                (SELECT COALESCE(SUM(checked_checklist_count), 0) FROM scoped_documents WHERE complete) AS checked,
                (SELECT COALESCE(SUM(inline_math_count), 0) FROM scoped_documents WHERE complete) AS inline_math,
                (SELECT COALESCE(jsonb_object_agg(key, total), '{}'::jsonb) FROM block_totals) AS blocks,
                (SELECT COUNT(*) FROM classified_uploads WHERE is_image) AS image_count,
                (SELECT COALESCE(SUM(size_bytes), 0) FROM classified_uploads WHERE is_image) AS image_size,
                (SELECT COUNT(*) FROM classified_uploads WHERE NOT is_image) AS file_count,
                (SELECT COALESCE(SUM(size_bytes), 0) FROM classified_uploads WHERE NOT is_image) AS file_size
            SQL, $bindings);
        abort_if($row === null || ($scope->nodeId !== null && (int) $row->scoped_node_count === 0), 404);
        $pending = (int) $row->pending_documents;
        $blocks = array_replace(array_fill_keys(DocumentStatisticsData::BLOCK_TYPES, 0), json_decode($row->blocks, true, 512, JSON_THROW_ON_ERROR));
        $blocks = array_map(intval(...), $blocks);
        $images = ['count' => (int) $row->image_count, 'size_bytes' => (int) $row->image_size];
        $files = ['count' => (int) $row->file_count, 'size_bytes' => (int) $row->file_size];

        return new StatisticsSummary(
            $scope,
            ['workspaces' => $scope->kind === 'account' ? (int) $row->workspaces : null,
                'documents' => (int) $row->documents,
                'folders' => in_array($scope->kind, ['account', 'workspace', 'folder'], true) ? (int) $row->folders : null,
                'databases' => in_array($scope->kind, ['account', 'workspace', 'folder'], true) ? (int) $row->databases : null,
                'database_entries' => $scope->kind === 'database' ? (int) $row->documents : null],
            $pending > 0 ? null : ['words' => (int) $row->words, 'characters' => (int) $row->characters, 'characters_without_spaces' => (int) $row->characters_without_spaces],
            $pending > 0 ? null : $blocks,
            $pending > 0 ? null : ['checked' => (int) $row->checked, 'unchecked' => max(0, $blocks['checklist_item'] - (int) $row->checked)],
            $pending > 0 ? null : (int) $row->inline_math,
            $pending > 0 && $scope->nodeId !== null ? null : ['images' => $images, 'files' => $files,
                'total' => ['count' => $images['count'] + $files['count'], 'size_bytes' => $images['size_bytes'] + $files['size_bytes']]],
            $pending,
        );
    }
}
