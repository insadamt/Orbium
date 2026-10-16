<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Services\Statistics\DocumentStatisticsData;
use App\Services\Statistics\RebuildDocumentStatistics;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class RebuildStatistics extends Command
{
    protected $signature = 'statistics:rebuild {--user= : Rebuild only this user ID} {--force : Rebuild even current statistics}';

    protected $description = 'Rebuild derived document statistics in resumable batches without changing edit history';

    public function handle(RebuildDocumentStatistics $rebuild): int
    {
        $userId = $this->option('user');
        if ($userId !== null && (! ctype_digit($userId) || (int) $userId < 1)) {
            $this->error('--user must be a positive user ID.');

            return self::INVALID;
        }
        $nodes = DB::table('nodes')->join('workspaces', 'workspaces.id', '=', 'nodes.workspace_id')->select('nodes.id');
        if ($userId !== null) {
            $nodes->where('workspaces.user_id', (int) $userId);
        }
        $documents = Document::query()->whereIn('node_id', $nodes);
        $force = (bool) $this->option('force');
        if (! $force) {
            $documents->where(fn ($query) => $query->whereNull('statistics_version')->orWhere('statistics_version', '!=', DocumentStatisticsData::VERSION));
        }
        $rebuilt = 0;
        $failed = 0;
        $documents->select('node_id')->chunkById(100, function (Collection $batch) use ($rebuild, $force, &$rebuilt, &$failed): void {
            foreach ($batch as $candidate) {
                $result = $rebuild->rebuild($candidate->node_id, $force);
                if ($result === 'rebuilt') {
                    $rebuilt++;
                } elseif ($result === 'failed') {
                    $failed++;
                    $this->warn('Document '.$candidate->node_id.' could not be rebuilt; inspect the application log.');
                }
            }
            $this->line("Rebuilt: {$rebuilt}; failed: {$failed}");
        }, 'node_id');
        $this->info("Finished. Rebuilt: {$rebuilt}; failed: {$failed}. Rerun to resume incomplete documents.");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
