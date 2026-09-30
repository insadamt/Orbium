<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('databases', function (Blueprint $table) {
            $table->foreignId('node_id')->primary()->constrained('nodes')->cascadeOnDelete();
            $table->timestamps();
        });
        Schema::create('database_properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('database_node_id')->constrained('databases', 'node_id')->cascadeOnDelete();
            $table->string('name');
            $table->string('type', 24);
            $table->unsignedInteger('position');
            $table->jsonb('config')->default('{}');
            $table->timestamps();
            $table->index(['database_node_id', 'position']);
        });
        Schema::create('database_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_node_id')->constrained('documents', 'node_id')->cascadeOnDelete();
            $table->foreignId('property_id')->constrained('database_properties')->cascadeOnDelete();
            $table->jsonb('value');
            $table->timestamps();
            $table->unique(['document_node_id', 'property_id']);
        });
        Schema::create('database_view_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('database_node_id')->constrained('databases', 'node_id')->cascadeOnDelete();
            $table->string('view_type', 16);
            $table->jsonb('config')->default('{}');
            $table->timestamps();
            $table->unique(['database_node_id', 'view_type']);
        });
        DB::table('nodes')->where('type', 'database')->orderBy('id')->chunkById(500, function ($nodes): void {
            foreach ($nodes as $node) {
                DB::table('databases')->insert(['node_id' => $node->id, 'created_at' => now(), 'updated_at' => now()]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('database_view_settings');
        Schema::dropIfExists('database_values');
        Schema::dropIfExists('database_properties');
        Schema::dropIfExists('databases');
    }
};
