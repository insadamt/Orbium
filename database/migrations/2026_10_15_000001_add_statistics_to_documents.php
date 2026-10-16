<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->unsignedBigInteger('word_count')->default(0);
            $table->unsignedBigInteger('character_count')->default(0);
            $table->unsignedBigInteger('character_count_without_spaces')->default(0);
            $table->jsonb('block_counts')->default('{}');
            $table->unsignedBigInteger('checked_checklist_count')->default(0);
            $table->unsignedBigInteger('inline_math_count')->default(0);
            $table->jsonb('body_attachment_ids')->default('[]');
            $table->unsignedInteger('statistics_version')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropColumn(['word_count', 'character_count', 'character_count_without_spaces', 'block_counts',
                'checked_checklist_count', 'inline_math_count', 'body_attachment_ids', 'statistics_version']);
        });
    }
};
