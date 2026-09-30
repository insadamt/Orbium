<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->unique(['workspace_id', 'name']);
        });
        Schema::create('node_tag', function (Blueprint $table) {
            $table->foreignId('node_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['node_id', 'tag_id']);
        });
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        DB::statement('CREATE INDEX nodes_title_trgm ON nodes USING gin (lower(title) gin_trgm_ops)');
        DB::statement("CREATE INDEX documents_search_fts ON documents USING gin (to_tsvector('simple', plain_text))");
        DB::statement('CREATE INDEX tags_name_trgm ON tags USING gin (lower(name) gin_trgm_ops)');
        DB::statement("CREATE INDEX database_values_search_fts ON database_values USING gin (to_tsvector('simple', value::text))");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS database_values_search_fts');
        DB::statement('DROP INDEX IF EXISTS documents_search_fts');
        DB::statement('DROP INDEX IF EXISTS nodes_title_trgm');
        Schema::dropIfExists('node_tag');
        Schema::dropIfExists('tags');
    }
};
