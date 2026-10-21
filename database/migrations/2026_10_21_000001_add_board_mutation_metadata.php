<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boards', function (Blueprint $table) {
            $table->uuid('last_mutation_id')->nullable();
            $table->string('last_mutation_hash', 64)->nullable();
        });
        Schema::table('board_objects', function (Blueprint $table) {
            //
            // Existing data is accounted once under its Board lock; the migration must not rewrite content or hold a whole-account data lock.
            //
            $table->unsignedInteger('data_bytes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('board_objects', fn (Blueprint $table) => $table->dropColumn('data_bytes'));
        Schema::table('boards', fn (Blueprint $table) => $table->dropColumn(['last_mutation_id', 'last_mutation_hash']));
    }
};
