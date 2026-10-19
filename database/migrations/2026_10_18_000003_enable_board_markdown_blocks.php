<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 2');
        DB::table('boards')->update(['format_version' => 2]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 2 AND revision >= 0)');
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK (block_type IN ('paragraph', 'markdown') AND content_format_version = 2)");
    }

    public function down(): void
    {
        // Refuse to make native fragments unreadable by the paragraph-only client.

        if (DB::table('board_objects')->exists()) {
            throw new RuntimeException('Remove all Board objects before downgrading Board Markdown support.');
        }
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK (block_type = 'paragraph' AND content_format_version = 2)");
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::table('boards')->update(['format_version' => 1]);
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 1');
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 1 AND revision >= 0)');
    }
};
