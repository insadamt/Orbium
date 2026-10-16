import {
    Blocks,
    CheckCheck,
    HardDrive,
    Type,
    type LucideIcon,
} from 'lucide-react';
import { StatisticsContent } from './statistics-content-summary';
import { formatCount, formatStorage } from './statistics-charts';
import type { StatisticsInsight } from './statistics-insight-types';
import { StatisticsInspectButton } from './statistics-inspect-button';
import type { StatisticsSummary } from './statistics-types';

export function StatisticsOverview({
    data,
    onInspect,
    selectedMetric,
}: {
    data: StatisticsSummary;
    selectedMetric: StatisticsInsight | null;
    onInspect: (detail: StatisticsInsight, trigger: HTMLButtonElement) => void;
}) {
    const metrics = [
        {
            detail: 'words',
            label: 'Words',
            value: formatCount(data.writing?.words),
            icon: Type,
        },
        {
            detail: 'blocks',
            label: 'Blocks',
            value: formatCount(data.total_blocks),
            icon: Blocks,
        },
        {
            detail: 'storage',
            label: 'Storage used',
            value: data.uploads
                ? formatStorage(data.uploads.total.size_bytes)
                : '—',
            icon: HardDrive,
        },
    ] satisfies {
        detail: StatisticsInsight;
        label: string;
        value: string;
        icon: LucideIcon;
    }[];
    const tasks = data.checklist;
    const totalTasks = tasks ? tasks.checked + tasks.unchecked : 0;
    const completedPercentage =
        tasks && totalTasks > 0 ? (tasks.checked / totalTasks) * 100 : 0;

    return (
        <>
            <div className="statistics-overview-metrics">
                {metrics.map(({ label, value, detail, icon: Icon }) => (
                    <div
                        key={label}
                        data-inspected={selectedMetric === detail}
                        className="statistics-metric min-w-0 rounded-xl border border-border/60 p-4 text-left md:p-5"
                    >
                        <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Icon
                                    size={17}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />
                                {label}
                            </span>
                            <StatisticsInspectButton
                                metric={detail}
                                selectedMetric={selectedMetric}
                                onInspect={onInspect}
                            />
                        </span>
                        <span className="mt-3 block text-3xl font-semibold tracking-tight break-words tabular-nums md:text-3xl">
                            {value}
                        </span>
                    </div>
                ))}
            </div>
            <StatisticsContent
                data={data}
                action={
                    <StatisticsInspectButton
                        metric="organization"
                        selectedMetric={selectedMetric}
                        onInspect={onInspect}
                    />
                }
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="statistics-overview-summary">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <CheckCheck size={17} aria-hidden="true" />
                        Tasks
                        <StatisticsInspectButton
                            metric="tasks"
                            selectedMetric={selectedMetric}
                            onInspect={onInspect}
                        />
                    </span>
                    <span className="mt-3 block text-sm">
                        {!tasks
                            ? 'Task totals are pending.'
                            : totalTasks === 0
                              ? 'No checklist items yet.'
                              : `${formatCount(tasks.checked)} of ${formatCount(totalTasks)} completed · ${Math.round(completedPercentage)}%`}
                    </span>
                    {tasks && totalTasks > 0 && (
                        <>
                            <span
                                className="my-3 block h-2 overflow-hidden rounded-full bg-muted"
                                aria-hidden="true"
                            >
                                <span
                                    className="block h-full rounded-full bg-foreground/65"
                                    style={{ width: `${completedPercentage}%` }}
                                />
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {formatCount(tasks.unchecked)} remaining
                            </span>
                        </>
                    )}
                </div>
                <div className="statistics-overview-summary">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <HardDrive size={17} aria-hidden="true" />
                        Uploads
                        <StatisticsInspectButton
                            metric="uploads"
                            selectedMetric={selectedMetric}
                            onInspect={onInspect}
                        />
                    </span>
                    <span className="mt-3 block text-sm">
                        {data.uploads
                            ? `${formatCount(data.uploads.images.count)} images · ${formatCount(data.uploads.files.count)} files`
                            : 'Upload totals are pending.'}
                    </span>
                </div>
            </div>
        </>
    );
}
