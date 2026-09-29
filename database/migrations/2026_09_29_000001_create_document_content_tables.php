<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_node_id')->nullable()->constrained('nodes')->nullOnDelete();
            $table->string('purpose', 24);
            $table->string('original_name');
            $table->string('mime_type', 127);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->string('storage_key');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'owner_node_id']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->foreignId('node_id')->primary()->constrained('nodes')->cascadeOnDelete();
            $table->jsonb('content');
            $table->unsignedInteger('content_format_version')->default(1);
            $table->text('plain_text')->default('');
            $table->foreignId('cover_attachment_id')->nullable()->constrained('attachments')->nullOnDelete();
            $table->unsignedBigInteger('revision')->default(0);
            $table->timestamps();
        });

        Schema::create('mentions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_document_node_id')->constrained('documents', 'node_id')->cascadeOnDelete();
            $table->foreignId('target_node_id')->constrained('nodes')->cascadeOnDelete();
            $table->string('display_text')->nullable();
            $table->timestamps();
            $table->unique(['source_document_node_id', 'target_node_id']);
            $table->index('target_node_id');
        });

        DB::table('nodes')->where('type', 'document')->orderBy('id')->chunkById(500, function ($nodes): void {
            foreach ($nodes as $node) {
                DB::table('documents')->insert([
                    'node_id' => $node->id,
                    'content' => json_encode(['type' => 'doc', 'content' => [['type' => 'paragraph']]]),
                    'content_format_version' => 1,
                    'plain_text' => '',
                    'revision' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentions');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('attachments');
    }
};
