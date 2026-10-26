<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        //
        // Older clients cannot represent disconnected ink in one object and must reject the newer Board envelope.
        //
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 6');
        DB::table('boards')->update(['format_version' => 6]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 6 AND revision >= 0)');
    }

    public function down(): void
    {
        //
        // Refuse downgrade while gaps remain, including drawings in Trash, so erased ink cannot silently reconnect.
        //
        if (DB::table('board_objects')->where('block_type', 'drawing')->whereRaw("jsonb_exists(data->'drawing', 'breaks')")->exists()) {
            throw new RuntimeException('Remove saved drawings with gaps before downgrading.');
        }
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 5');
        DB::table('boards')->update(['format_version' => 5]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 5 AND revision >= 0)');
    }
};
