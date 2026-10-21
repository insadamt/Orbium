<?php

namespace App\Console\Commands;

use App\Actions\Boards\SaveBoard;
use App\Actions\Nodes\ManageHierarchy;
use App\Models\Node;
use App\Models\Workspace;
use App\Services\Boards\BoardContent;
use App\Services\Boards\BoardSaveData;
use App\Services\Boards\BoardSaveRules;
use App\Services\Boards\BoardStressScene;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

final class CreateBoardStressScene extends Command
{
    protected $signature = 'boards:stress {workspace : Destination workspace ID}
        {--count=500 : Number of blocks, from 1 to 1000}
        {--kind=mixed : mixed or plain}
        {--layout=spread : spread grid or dense overlapping grid}';

    protected $description = 'Create a disposable, synthetic Board for local manual performance checks';

    public function handle(BoardStressScene $scene, ManageHierarchy $hierarchy, SaveBoard $save): int
    {
        //
        // Fixture creation stays local so a profiling command cannot fill a deployed account accidentally.
        //
        if (! app()->environment('local')) {
            $this->error('Stress Board creation is available only in the local environment.');

            return self::FAILURE;
        }

        $options = Validator::make([
            'workspace' => $this->argument('workspace'),
            'count' => $this->option('count'),
            'kind' => $this->option('kind'),
            'layout' => $this->option('layout'),
        ], [
            'workspace' => ['required', 'integer', 'min:1'],
            'count' => ['required', 'integer', 'between:1,'.BoardContent::MAX_OBJECTS],
            'kind' => ['required', 'in:mixed,plain'],
            'layout' => ['required', 'in:spread,dense'],
        ])->validate();

        $workspace = Workspace::query()->findOrFail((int) $options['workspace']);
        $count = (int) $options['count'];
        $kind = (string) $options['kind'];
        $layout = (string) $options['layout'];
        $objects = $scene->objects($count, $kind, $layout);

        //
        // Use the ordinary save contract; fixtures must exercise supported data rather than bypass its limits.
        //
        Validator::make(['format_version' => BoardContent::FORMAT_VERSION, 'revision' => 0, 'objects' => $objects], BoardSaveRules::rules())->validate();
        $board = DB::transaction(function () use ($workspace, $hierarchy, $save, $objects, $count, $kind, $layout): Node {
            $title = "Stress Board — {$count} {$kind} ({$layout}) — ".now()->format('Y-m-d H:i:s');
            $node = $hierarchy->create($workspace, 'board', $title, null);
            $save->save($node, new BoardSaveData(0, $objects));

            return $node;
        });

        $this->info("Created {$board->title}");
        $this->line(route('boards.show', ['workspace' => $workspace->id, 'node' => $board->id]));
        $this->line('10 columns; '.($layout === 'spread' ? '640 × 600' : '180 × 140').' world-unit spacing. Start at the top left at 100% zoom.');
        $this->line('No media uploads or linked Documents are included. Trash this Board normally when finished.');
        if ($count === BoardContent::MAX_OBJECTS) {
            $this->line('This Board is at the 1,000-block limit. Delete a block before testing insertion or duplication.');
        }

        return self::SUCCESS;
    }
}
