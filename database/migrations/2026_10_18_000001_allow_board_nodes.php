<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE nodes DROP CONSTRAINT nodes_type_check');
        DB::statement("ALTER TABLE nodes ADD CONSTRAINT nodes_type_check CHECK (type IN ('folder', 'document', 'database', 'board'))");
    }

    public function down(): void
    {
        // Trashed Boards remain owned data and must also block an incompatible downgrade.

        if (DB::table('nodes')->where('type', 'board')->exists()) {
            throw new RuntimeException('Permanently delete all Boards before rolling back Board support.');
        }

        DB::statement('ALTER TABLE nodes DROP CONSTRAINT nodes_type_check');
        DB::statement("ALTER TABLE nodes ADD CONSTRAINT nodes_type_check CHECK (type IN ('folder', 'document', 'database'))");
    }
};
