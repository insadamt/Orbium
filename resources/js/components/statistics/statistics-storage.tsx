import { File, HardDrive, Image } from 'lucide-react';
import type { StatisticsSummary } from './statistics-types';
import {
    formatCount,
    formatShare,
    formatStorage,
    StatisticsSection,
} from './statistics-charts';

export function StatisticsStorage({ data }: { data: StatisticsSummary }) {
    const uploads = data.uploads;
    const totalBytes = uploads?.total.size_bytes ?? 0;
    return (
        <StatisticsSection
            title="Storage"
            icon={HardDrive}
            description="What consumes space?"
        >
            {uploads ? (
                <>
                    <dl className="mb-5">
                        <dt className="text-sm text-muted-foreground">
                            Storage used
                        </dt>
                        <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                            {formatStorage(totalBytes)}
                        </dd>
                    </dl>
                    <div
                        className="mb-5 flex h-3 overflow-hidden rounded-full bg-muted"
                        aria-hidden="true"
                    >
                        {(['images', 'files'] as const).map((kind) => (
                            <div
                                key={kind}
                                className={
                                    kind === 'images'
                                        ? 'bg-foreground/70'
                                        : 'bg-foreground/25'
                                }
                                style={{
                                    width: `${totalBytes > 0 ? (uploads[kind].size_bytes / totalBytes) * 100 : 0}%`,
                                }}
                            />
                        ))}
                    </div>
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">
                            Upload counts and original sizes by category
                        </caption>
                        <thead>
                            <tr className="border-b border-border/60 text-xs text-muted-foreground">
                                <th scope="col" className="pb-3 font-normal">
                                    Category
                                </th>
                                <th
                                    scope="col"
                                    className="pb-3 text-right font-normal"
                                >
                                    Uploads
                                </th>
                                <th
                                    scope="col"
                                    className="pb-3 text-right font-normal"
                                >
                                    Size
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(['images', 'files'] as const).map((kind) => {
                                const Icon = kind === 'images' ? Image : File;
                                const item = uploads[kind];
                                return (
                                    <tr
                                        key={kind}
                                        className="border-b border-border/50"
                                    >
                                        <th
                                            scope="row"
                                            className="py-4 font-normal"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    aria-hidden="true"
                                                    className={`size-2 shrink-0 rounded-full ${kind === 'images' ? 'bg-foreground/70' : 'bg-foreground/25'}`}
                                                />
                                                <Icon
                                                    size={15}
                                                    aria-hidden="true"
                                                    className="hidden text-muted-foreground sm:block"
                                                />
                                                {kind === 'images'
                                                    ? 'Images'
                                                    : 'Files'}
                                            </span>
                                        </th>
                                        <td className="py-4 text-right tabular-nums">
                                            {formatCount(item.count)}
                                        </td>
                                        <td className="py-4 text-right tabular-nums">
                                            {formatStorage(item.size_bytes)}
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                {formatShare(
                                                    item.size_bytes,
                                                    totalBytes,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="font-medium">
                                <th scope="row" className="pt-4">
                                    Total
                                </th>
                                <td className="pt-4 text-right tabular-nums">
                                    {formatCount(uploads.total.count)}
                                </td>
                                <td className="pt-4 text-right tabular-nums">
                                    {formatStorage(totalBytes)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    {uploads.total.count === 0 && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            No uploads in this scope.
                        </p>
                    )}
                    <details className="statistics-details">
                        <summary>Storage details</summary>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Average upload size:{' '}
                            <span className="font-medium text-foreground">
                                {uploads.total.count > 0
                                    ? formatStorage(
                                          totalBytes / uploads.total.count,
                                      )
                                    : '—'}
                            </span>
                            . Reusing an upload counts it once.
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {data.scope.kind === 'account' ||
                            data.scope.kind === 'workspace'
                                ? 'Includes unused and retained uploads.'
                                : 'Includes uploads referenced by this page and its contents.'}{' '}
                            Sizes include original files only.
                        </p>
                    </details>
                </>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Storage totals will appear when statistics are ready.
                </p>
            )}
        </StatisticsSection>
    );
}
