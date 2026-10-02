<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('cover_aspect_ratio', 8)->nullable();
        });
        Schema::table('nodes', function (Blueprint $table) {
            $table->string('cover_aspect_ratio', 8)->nullable();
            $table->jsonb('gallery_config')->nullable();
        });
        Schema::table('workspaces', function (Blueprint $table) {
            $table->jsonb('gallery_config')->nullable();
        });

        $legacyGallery = json_encode(['layout' => 'uniform', 'ratio' => '16:9', 'fit' => 'crop', 'legacy_preview' => true], JSON_THROW_ON_ERROR);
        DB::table('nodes')->where('type', 'folder')->update(['gallery_config' => $legacyGallery]);
        DB::table('workspaces')->update(['gallery_config' => $legacyGallery]);
        DB::table('database_view_settings')->where('view_type', 'gallery')->get()->each(function ($setting): void {
            $config = json_decode($setting->config, true) ?: [];
            $config['gallery_layout'] = 'uniform';
            $config['gallery_ratio'] = '16:9';
            $config['gallery_fit'] = 'crop';
            $config['gallery_legacy_preview'] = true;
            DB::table('database_view_settings')->where('id', $setting->id)->update(['config' => json_encode($config, JSON_THROW_ON_ERROR)]);
        });
        DB::table('databases')->whereNotIn('node_id', DB::table('database_view_settings')->where('view_type', 'gallery')->select('database_node_id'))
            ->pluck('node_id')->each(function ($databaseId) use ($legacyGallery): void {
                $appearance = json_decode($legacyGallery, true);
                DB::table('database_view_settings')->insert([
                    'database_node_id' => $databaseId,
                    'view_type' => 'gallery',
                    'config' => json_encode([
                        'gallery_layout' => $appearance['layout'],
                        'gallery_ratio' => $appearance['ratio'],
                        'gallery_fit' => $appearance['fit'],
                        'gallery_legacy_preview' => true,
                    ], JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('workspaces', fn (Blueprint $table) => $table->dropColumn('gallery_config'));
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn(['cover_aspect_ratio', 'gallery_config']);
        });
        Schema::table('documents', fn (Blueprint $table) => $table->dropColumn('cover_aspect_ratio'));
    }
};
