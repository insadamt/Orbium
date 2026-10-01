<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->foreignId('cover_attachment_id')->nullable()->constrained('attachments')->nullOnDelete();
            $table->foreignId('icon_attachment_id')->nullable()->constrained('attachments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('icon_attachment_id');
            $table->dropConstrainedForeignId('cover_attachment_id');
        });
    }
};
