<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        //
        // Earlier clients flatten unknown inline atoms, so their saves must fail before reaching object data.
        //
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 8');
        DB::table('boards')->update(['format_version' => 8]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 8 AND revision >= 0)');
    }

    public function down(): void
    {
        if (DB::table('board_objects')->whereIn('block_type', ['text', 'heading', 'list', 'quote', 'callout', 'table'])->whereRaw("jsonb_path_exists(data, '$.** ? (@.type == \"inlineIcon\")')")->exists()) {
            throw new RuntimeException('Remove saved Board inline icons, including in Trash, before downgrading.');
        }
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::table('boards')->update(['format_version' => 7]);
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 7');
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 7 AND revision >= 0)');
    }
};
