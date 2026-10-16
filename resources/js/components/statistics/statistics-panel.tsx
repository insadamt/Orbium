import {
    Blocks,
    FileText,
    HardDrive,
    Info,
    RefreshCw,
    Type,
    type LucideIcon,
} from 'lucide-react';
import { StatisticsWriting } from './statistics-writing';
import { StatisticsStorage } from './statistics-storage';
import {
    StatisticsBlocks,
    StatisticsContent,
    StatisticsTasks,
} from './statistics-breakdowns';
import { formatCount, formatStorage } from './statistics-charts';
import type { StatisticsSummary } from './statistics-types';
import { useStatistics } from './use-statistics';

export function StatisticsPanel({ url }: { url: string }) {
    const { data, error, loading, refresh } = useStatistics(url);
    return (
        <section
            aria-label="Statistics"
            aria-busy={loading}
            className="space-y-8"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {data?.scope.name ?? 'Your content'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {data
                            ? `${data.scope.kind === 'account' ? 'Account' : data.scope.kind.charAt(0).toUpperCase() + data.scope.kind.slice(1)} statistics · Saved content only`
                            : 'Saved content only'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                    <RefreshCw size={15} aria-hidden="true" />
                    Refresh
                </button>
            </div>
            {loading && !data && (
                <div role="status" className="space-y-5">
                    <p className="text-sm text-muted-foreground">
                        Loading statistics…
                    </p>
                    <div
                        aria-hidden="true"
                        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                    >
                        {[0, 1, 2, 3].map((key) => (
                            <div
                                key={key}
                                className="h-32 rounded-2xl bg-muted/60"
                            />
                        ))}
                    </div>
                </div>
            )}
            {loading && data && (
                <p role="status" className="text-xs text-muted-foreground">
                    Refreshing saved totals…
                </p>
            )}
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-border p-5 text-sm"
                >
                    <p>{error}</p>
                    {data && (
                        <p className="mt-2 text-muted-foreground">
                            Showing the last loaded totals.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={refresh}
                        className="mt-3 rounded-lg bg-accent px-3 py-2"
                    >
                        Try again
                    </button>
                </div>
            )}
            {data && <StatisticsSummaryContent data={data} />}
        </section>
    );
}

function StatisticsSummaryContent({ data }: { data: StatisticsSummary }) {
    const metrics: {
        label: string;
        value: string;
        icon: LucideIcon;
        detail: string;
    }[] = [
        {
            label: 'Documents',
            value: formatCount(data.content.documents),
            icon: FileText,
            detail: 'Excluding Trash',
        },
        {
            label: 'Words',
            value: formatCount(data.writing?.words),
            icon: Type,
            detail: 'Across saved writing',
        },
        {
            label: 'Blocks',
            value: formatCount(data.total_blocks),
            icon: Blocks,
            detail: 'All content block types',
        },
        {
            label: 'Storage used',
            value: data.uploads
                ? formatStorage(data.uploads.total.size_bytes)
                : '—',
            icon: HardDrive,
            detail: 'Original files only',
        },
    ];
    return (
        <>
            {!data.completeness.complete && (
                <div
                    role="status"
                    className="rounded-xl border border-border bg-accent/40 p-4 text-sm"
                >
                    <p className="font-medium">Updating statistics</p>
                    <p className="mt-1 text-muted-foreground">
                        {formatCount(data.completeness.pending_documents)}{' '}
                        documents still need processing. Unavailable totals show
                        —. Refresh to check again.
                    </p>
                </div>
            )}
            {data.content.documents === 0 && (
                <p className="text-sm text-muted-foreground">
                    No documents here yet. Other content and uploads are shown
                    below.
                </p>
            )}
            <section aria-label="Overview">
                <h2 className="mb-4 text-lg font-semibold tracking-tight">
                    Overview
                </h2>
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {metrics.map(({ label, value, icon: Icon, detail }) => (
                        <div
                            key={label}
                            className="statistics-metric min-w-0 rounded-2xl border border-border/60 p-4 md:p-5"
                        >
                            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Icon size={17} aria-hidden="true" />
                                {label}
                            </dt>
                            <dd className="mt-4 text-3xl font-semibold tracking-tight break-words tabular-nums md:text-4xl">
                                {value}
                            </dd>
                            <dd className="mt-2 text-xs text-muted-foreground">
                                {detail}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
            <StatisticsWriting data={data} />
            <StatisticsContent data={data} />
            <StatisticsBlocks data={data} />
            <StatisticsTasks data={data} />
            <StatisticsStorage data={data} />
            <details className="rounded-xl border border-border/60 px-5 py-4 text-xs text-muted-foreground">
                <summary className="cursor-pointer text-sm">
                    <Info
                        size={15}
                        className="mr-2 inline"
                        aria-hidden="true"
                    />
                    How these numbers are counted
                </summary>
                <div className="mt-4 space-y-3 leading-relaxed">
                    <p>
                        Content excludes Trash and descendants of trashed
                        containers. Writing excludes titles and database
                        properties; whitespace is normalized. Characters are
                        counted as Unicode code points.
                    </p>
                    <p>
                        List items count individually. Tables count once.
                        Formatting wrappers and empty paragraphs do not add
                        blocks. Inline math is counted separately.
                    </p>
                    <p>
                        {data.scope.kind === 'account'
                            ? 'Account uploads include unused Library items and uploads retained in trashed workspaces.'
                            : data.scope.kind === 'workspace'
                              ? 'Workspace uploads include unused Library items and uploads retained after content is trashed.'
                              : 'Page uploads include distinct references in saved content, page covers, icons, and database Files values. Containers include descendants.'}{' '}
                        Reusing an upload counts it once. Storage includes
                        original file sizes, excluding caches, thumbnails, and
                        database overhead.
                    </p>
                    <p>
                        Charts describe the current saved content. Refresh
                        fetches totals without saving an open document or
                        starting statistics processing.
                    </p>
                </div>
            </details>
        </>
    );
}
