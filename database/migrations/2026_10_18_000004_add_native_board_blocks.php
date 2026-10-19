<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('board_objects', function (Blueprint $table) {
            $table->jsonb('data')->nullable();
            $table->text('markdown')->nullable()->change();
        });
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 3');
        DB::table('boards')->update(['format_version' => 3]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 3 AND revision >= 0)');
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK ((content_format_version = 2 AND block_type IN ('paragraph', 'markdown') AND markdown IS NOT NULL AND data IS NULL) OR (content_format_version = 1 AND block_type IN ('text','heading','list','quote','callout','code','table','image','file','math','mermaid','divider') AND data IS NOT NULL AND jsonb_typeof(data) = 'object' AND markdown IS NULL))");
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_geometry_check');
        DB::statement('ALTER TABLE board_objects ADD CONSTRAINT board_objects_geometry_check CHECK (x BETWEEN -10000000 AND 10000000 AND y BETWEEN -10000000 AND 10000000 AND width BETWEEN 80 AND 4000 AND height BETWEEN 32 AND 4000 AND layer BETWEEN 0 AND 1000000)');
    }

    public function down(): void
    {
        // Native blocks cannot be losslessly downgraded to document fragments.

        if (DB::table('board_objects')->exists()) {
            throw new RuntimeException('Remove all Board objects before downgrading native Board blocks.');
        }
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK (block_type IN ('paragraph','markdown') AND content_format_version = 2)");
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_geometry_check');
        DB::statement('ALTER TABLE board_objects ADD CONSTRAINT board_objects_geometry_check CHECK (x BETWEEN -10000000 AND 10000000 AND y BETWEEN -10000000 AND 10000000 AND width BETWEEN 160 AND 4000 AND height BETWEEN 100 AND 4000 AND layer BETWEEN 0 AND 1000000)');
        Schema::table('board_objects', function (Blueprint $table) {
            $table->dropColumn('data');
            $table->text('markdown')->nullable(false)->change();
        });
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::table('boards')->update(['format_version' => 2]);
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 2');
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 2 AND revision >= 0)');
    }
};
