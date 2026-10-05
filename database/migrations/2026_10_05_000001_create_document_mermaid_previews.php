<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_mermaid_previews', function (Blueprint $table) {
            $table->foreignId('document_node_id')->constrained('documents', 'node_id')->cascadeOnDelete();
            $table->char('source_hash', 64);
            $table->string('renderer_version', 80);
            $table->string('render_id', 100);
            $table->text('svg');
            $table->timestamps();
            $table->primary(['document_node_id', 'source_hash', 'renderer_version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_mermaid_previews');
    }
};
