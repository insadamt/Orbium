import { useState } from 'react';
import {
    AlignLeft,
    Blocks,
    Braces,
    CheckCheck,
    Database,
    File,
    FileText,
    Folder,
    Heading,
    Image,
    List,
    ListOrdered,
    MessageSquare,
    Minus,
    Quote,
    Sigma,
    Table,
    Workflow,
    type LucideIcon,
} from 'lucide-react';
import { blockLabels, type StatisticsSummary } from './statistics-types';
import {
    formatAverage,
    formatCount,
    StatisticsBars,
    StatisticsSection,
} from './statistics-charts';

type BlockType = keyof typeof blockLabels;
const blockIcons: Record<BlockType, LucideIcon> = {
    paragraph: AlignLeft,
    heading_1: Heading,
    heading_2: Heading,
    heading_3: Heading,
    heading_4: Heading,
    heading_5: Heading,
    heading_6: Heading,
    bullet_list_item: List,
    numbered_list_item: ListOrdered,
    checklist_item: CheckCheck,
    quote: Quote,
    callout: MessageSquare,
    code: Braces,
    table: Table,
    image: Image,
    file: File,
    divider: Minus,
    mermaid: Workflow,
    math: Sigma,
};

export function StatisticsContent({ data }: { data: StatisticsSummary }) {
    if (data.scope.kind === 'document') return null;
    const items = [
        { label: 'Documents', value: data.content.documents, icon: FileText },
        { label: 'Folders', value: data.content.folders, icon: Folder },
        { label: 'Databases', value: data.content.databases, icon: Database },
        { label: 'Workspaces', value: data.content.workspaces, icon: Blocks },
    ].filter((item) => item.value !== null);
    return (
        <StatisticsSection
            title="Content"
            icon={Folder}
            description="How is this space organized?"
        >
            <dl className="grid gap-x-8 sm:grid-cols-2">
                {items.map(({ label, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-4 border-b border-border/50 py-3"
                    >
                        <dt className="flex items-center gap-2 text-sm">
                            <Icon
                                size={16}
                                className="text-muted-foreground"
                                aria-hidden="true"
                            />
                            {label}
                        </dt>
                        <dd className="font-semibold tabular-nums">
                            {formatCount(value)}
                        </dd>
                    </div>
                ))}
            </dl>
            {data.content.database_entries !== null && (
                <p className="mt-4 text-sm text-muted-foreground">
                    {formatCount(data.content.database_entries)} database
                    entries · already included in Documents.
                </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
                Counts exclude Trash. Folder and database scopes count their
                contents.
            </p>
        </StatisticsSection>
    );
}

export function StatisticsBlocks({ data }: { data: StatisticsSummary }) {
    const [showAllBlocks, setShowAllBlocks] = useState(false);
    const blocks = Object.entries(blockLabels)
        .map(([key, label]) => ({
            label,
            value: data.blocks?.[key as BlockType] ?? 0,
            icon: blockIcons[key as BlockType],
        }))
        .sort((a, b) => b.value - a.value);
    const usedBlocks = blocks.filter((block) => block.value > 0);
    const visibleBlocks = showAllBlocks ? blocks : usedBlocks.slice(0, 6);
    return (
        <StatisticsSection
            title="Blocks"
            icon={Blocks}
            description="What kinds of content do you use?"
        >
            {data.blocks ? (
                <>
                    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                        <p className="text-sm">
                            <strong className="font-semibold tabular-nums">
                                {formatCount(data.total_blocks)}
                            </strong>{' '}
                            total blocks
                        </p>
                        {data.scope.kind !== 'document' && (
                            <p className="text-xs text-muted-foreground">
                                {formatAverage(
                                    data.total_blocks,
                                    data.content.documents,
                                )}{' '}
                                blocks per document
                            </p>
                        )}
                    </div>
                    {visibleBlocks.length > 0 ? (
                        <StatisticsBars
                            items={visibleBlocks}
                            total={data.total_blocks ?? 0}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No blocks here yet.
                        </p>
                    )}
                    {usedBlocks.length > 0 && (
                        <p className="mt-4 text-xs text-muted-foreground">
                            {!showAllBlocks && usedBlocks.length > 6
                                ? 'Showing the 6 most used types. '
                                : ''}
                            Bars compare counts; percentages use all blocks.
                        </p>
                    )}
                    <button
                        type="button"
                        aria-expanded={showAllBlocks}
                        onClick={() => setShowAllBlocks(!showAllBlocks)}
                        className="mt-5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                    >
                        {showAllBlocks
                            ? 'Show most used'
                            : 'Show all block types'}
                    </button>
                    <p className="mt-5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                        Inline math:{' '}
                        <span className="font-medium text-foreground tabular-nums">
                            {formatCount(data.inline_math)}
                        </span>{' '}
                        occurrences, counted separately.
                    </p>
                </>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Block totals will appear when statistics are ready.
                </p>
            )}
        </StatisticsSection>
    );
}

export function StatisticsTasks({ data }: { data: StatisticsSummary }) {
    const tasks = data.checklist;
    const total = tasks ? tasks.checked + tasks.unchecked : 0;
    const percentage = tasks && total > 0 ? (tasks.checked / total) * 100 : 0;
    return (
        <StatisticsSection
            title="Tasks"
            icon={CheckCheck}
            description="How many checklist items are complete?"
        >
            {tasks ? (
                total > 0 ? (
                    <>
                        <p className="text-lg font-semibold tabular-nums">
                            {formatCount(tasks.checked)} of {formatCount(total)}{' '}
                            completed
                        </p>
                        <div
                            className="my-4 h-3 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-label="Completed checklist items"
                            aria-valuemin={0}
                            aria-valuemax={total}
                            aria-valuenow={tasks.checked}
                            aria-valuetext={`${tasks.checked} of ${total} completed`}
                        >
                            <div
                                className="h-full rounded-full bg-foreground/65"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatCount(tasks.unchecked)} remaining ·{' '}
                            {Math.round(percentage)}% complete
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No checklist items here yet.
                    </p>
                )
            ) : (
                <p className="text-sm text-muted-foreground">
                    Task totals will appear when statistics are ready.
                </p>
            )}
        </StatisticsSection>
    );
}
