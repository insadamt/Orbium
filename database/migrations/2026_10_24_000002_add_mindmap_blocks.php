<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        //
        // Older Board clients must reject maps rather than saving a snapshot without them.
        //
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 7');
        DB::table('boards')->update(['format_version' => 7]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 7 AND revision >= 0)');
        $this->replaceContentConstraint(true);
    }

    public function down(): void
    {
        if (DB::table('board_objects')->where('block_type', 'mindmap')->exists()) {
            throw new RuntimeException('Remove saved Board Mind Maps, including in Trash, before downgrading.');
        }
        $this->replaceContentConstraint(false);
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::table('boards')->update(['format_version' => 6]);
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 6');
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 6 AND revision >= 0)');
    }

    private function replaceContentConstraint(bool $includeMindMap): void
    {
        $kinds = "'text','heading','list','quote','callout','code','table','image','file','math','mermaid','divider','resource','drawing'";
        if ($includeMindMap) {
            $kinds .= ",'mindmap'";
        }
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK ((content_format_version = 2 AND block_type IN ('paragraph','markdown') AND markdown IS NOT NULL AND data IS NULL) OR (content_format_version = 1 AND block_type IN ($kinds) AND data IS NOT NULL AND jsonb_typeof(data) = 'object' AND markdown IS NULL))");
    }
};
