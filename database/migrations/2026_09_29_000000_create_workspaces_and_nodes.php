<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->unsignedInteger('position');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'position']);
        });

        Schema::create('nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('nodes')->restrictOnDelete();
            $table->string('type', 16);
            $table->string('title');
            $table->string('icon')->nullable();
            $table->unsignedInteger('position');
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'parent_id', 'position']);
            $table->index(['workspace_id', 'deleted_at']);
        });

        DB::statement("ALTER TABLE nodes ADD CONSTRAINT nodes_type_check CHECK (type IN ('folder', 'document', 'database'))");
        DB::statement('CREATE INDEX nodes_title_trgm_idx ON nodes USING gin (title gin_trgm_ops)');
    }

    public function down(): void
    {
        Schema::dropIfExists('nodes');
        Schema::dropIfExists('workspaces');
    }
};
