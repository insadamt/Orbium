<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->foreignId('node_id')->primary()->constrained('nodes')->cascadeOnDelete();
            $table->unsignedInteger('format_version')->default(1);
            $table->unsignedBigInteger('revision')->default(0);
            $table->timestamps();
        });
        Schema::create('board_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_node_id')->constrained('boards', 'node_id')->cascadeOnDelete();
            $table->uuid('object_id');
            $table->string('block_type', 32);
            $table->unsignedInteger('content_format_version')->default(2);
            $table->text('markdown');
            $table->double('x');
            $table->double('y');
            $table->double('width');
            $table->double('height');
            $table->unsignedInteger('layer');
            $table->timestamps();
            $table->unique(['board_node_id', 'object_id']);
        });
        DB::statement('ALTER TABLE boards ADD CONSTRAINT boards_versions_check CHECK (format_version = 1 AND revision >= 0)');
        DB::statement("ALTER TABLE board_objects ADD CONSTRAINT board_objects_content_check CHECK (block_type = 'paragraph' AND content_format_version = 2)");
        DB::statement('ALTER TABLE board_objects ADD CONSTRAINT board_objects_geometry_check CHECK (x BETWEEN -10000000 AND 10000000 AND y BETWEEN -10000000 AND 10000000 AND width BETWEEN 160 AND 4000 AND height BETWEEN 100 AND 4000 AND layer BETWEEN 0 AND 1000000)');
        DB::table('boards')->insertUsing(['node_id', 'created_at', 'updated_at'], DB::table('nodes')->where('type', 'board')->select(['id', 'created_at', 'updated_at']));
    }

    public function down(): void
    {
        // An accidental downgrade must not silently destroy spatial knowledge.

        if (DB::table('board_objects')->exists()) {
            throw new RuntimeException('Remove all Board objects before rolling back Board content support.');
        }
        Schema::dropIfExists('board_objects');
        Schema::dropIfExists('boards');
    }
};
