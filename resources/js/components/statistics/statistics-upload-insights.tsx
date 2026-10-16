import { StatisticsCompositionChart } from './statistics-composition-chart';
import {
    StatisticsInsightTotal,
    StatisticsInsightValues,
} from './statistics-insight-values';
import { formatCount, formatStorage } from './statistics-charts';
import type { StatisticsSummary } from './statistics-types';

export function StatisticsUploadInsights({
    data,
    metric,
}: {
    data: StatisticsSummary;
    metric: 'storage' | 'uploads';
}) {
    const uploads = data.uploads;
    if (!uploads)
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Upload totals pending.
            </p>
        );
    const showSize = metric === 'storage';
    return (
        <>
            <StatisticsInsightTotal
                label={showSize ? 'Storage used' : 'Unique uploads'}
                value={
                    showSize
                        ? formatStorage(uploads.total.size_bytes)
                        : formatCount(uploads.total.count)
                }
            />
            <StatisticsInsightValues
                items={[
                    {
                        label: showSize ? 'Uploads' : 'Storage used',
                        value: showSize
                            ? formatCount(uploads.total.count)
                            : formatStorage(uploads.total.size_bytes),
                    },
                    {
                        label: 'Average file size',
                        value:
                            uploads.total.count > 0
                                ? formatStorage(
                                      uploads.total.size_bytes /
                                          uploads.total.count,
                                  )
                                : '—',
                    },
                ]}
            />
            <StatisticsCompositionChart
                label={showSize ? 'Storage by type' : 'Uploads by type'}
                totalValue={
                    showSize
                        ? formatStorage(uploads.total.size_bytes)
                        : formatCount(uploads.total.count)
                }
                totalLabel={showSize ? 'Original files' : 'Uploads'}
                items={(['images', 'files'] as const).map((kind) => ({
                    label: kind === 'images' ? 'Images' : 'Files',
                    value: showSize
                        ? uploads[kind].size_bytes
                        : uploads[kind].count,
                    formattedValue: showSize
                        ? formatStorage(uploads[kind].size_bytes)
                        : formatCount(uploads[kind].count),
                }))}
            />
            <table className="statistics-insight-table">
                <caption className="sr-only">
                    Unique upload counts and original sizes
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Count</th>
                        <th scope="col">Size</th>
                    </tr>
                </thead>
                <tbody>
                    {(['images', 'files'] as const).map((kind) => (
                        <tr key={kind}>
                            <th scope="row">
                                {kind === 'images' ? 'Images' : 'Files'}
                            </th>
                            <td>{formatCount(uploads[kind].count)}</td>
                            <td>{formatStorage(uploads[kind].size_bytes)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {uploads.total.count === 0 && (
                <p className="text-sm text-muted-foreground">No uploads yet.</p>
            )}
        </>
    );
}
