<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 4');
        DB::table('boards')->update(['format_version' => 4]);
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 4 AND revision >= 0)');
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK ((content_format_version = 2 AND block_type IN ('paragraph','markdown') AND markdown IS NOT NULL AND data IS NULL) OR (content_format_version = 1 AND block_type IN ('text','heading','list','quote','callout','code','table','image','file','math','mermaid','divider','resource') AND data IS NOT NULL AND jsonb_typeof(data) = 'object' AND markdown IS NULL))");
        Schema::create('board_document_creations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_node_id')->constrained('boards', 'node_id')->cascadeOnDelete();
            $table->uuid('request_id');
            $table->string('request_hash', 64);
            $table->foreignId('document_node_id')->nullable()->constrained('nodes')->nullOnDelete();
            $table->unsignedBigInteger('result_revision');
            $table->timestamps();
            $table->unique(['board_node_id', 'request_id']);
        });
    }

    public function down(): void
    {
        // A downgrade must not silently discard live page references or creation receipts.

        if (DB::table('board_objects')->where('block_type', 'resource')->exists() || DB::table('board_document_creations')->exists()) {
            throw new RuntimeException('Remove resource cards and review Document creation receipts before downgrading.');
        }
        Schema::dropIfExists('board_document_creations');
        DB::statement('ALTER TABLE board_objects DROP CONSTRAINT board_objects_content_check');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK ((content_format_version = 2 AND block_type IN ('paragraph','markdown') AND markdown IS NOT NULL AND data IS NULL) OR (content_format_version = 1 AND block_type IN ('text','heading','list','quote','callout','code','table','image','file','math','mermaid','divider') AND data IS NOT NULL AND jsonb_typeof(data) = 'object' AND markdown IS NULL))");
        DB::statement('ALTER TABLE boards DROP CONSTRAINT boards_versions_check');
        DB::table('boards')->update(['format_version' => 3]);
        DB::statement('ALTER TABLE boards ALTER COLUMN format_version SET DEFAULT 3');
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 3 AND revision >= 0)');
    }
};
