import { useState } from 'react';
import { blockIcons } from './statistics-block-icons';
import {
    StatisticsBars,
    formatAverage,
    formatCount,
    formatShare,
} from './statistics-charts';
import {
    StatisticsInsightTotal,
    StatisticsInsightValues,
} from './statistics-insight-values';
import { blockLabels, type StatisticsSummary } from './statistics-types';

export function StatisticsBlockInsights({ data }: { data: StatisticsSummary }) {
    const [showAll, setShowAll] = useState(false);
    if (!data.blocks)
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Block totals pending.
            </p>
        );
    const blocks = Object.entries(blockLabels)
        .map(([key, label]) => ({
            label,
            value: data.blocks?.[key as keyof typeof blockLabels] ?? 0,
            icon: blockIcons[key as keyof typeof blockLabels],
        }))
        .sort((left, right) => right.value - left.value);
    const used = blocks.filter((block) => block.value > 0);
    const leading = used[0];
    return (
        <>
            <StatisticsInsightTotal
                label="Total blocks"
                value={formatCount(data.total_blocks)}
            />
            <StatisticsInsightValues
                items={[
                    { label: 'Types used', value: formatCount(used.length) },
                    {
                        label: 'Inline math',
                        value: formatCount(data.inline_math),
                    },
                    ...(data.scope.kind === 'document'
                        ? []
                        : [
                              {
                                  label: 'Blocks / document',
                                  value: formatAverage(
                                      data.total_blocks,
                                      data.content.documents,
                                  ),
                              },
                          ]),
                ]}
            />
            {leading && (
                <div className="statistics-insight-highlight">
                    <span className="text-xs text-muted-foreground">
                        Most used
                    </span>
                    <span className="mt-1 block text-sm font-medium">
                        {leading.label}{' '}
                        <span className="text-muted-foreground">
                            ·{' '}
                            {formatShare(leading.value, data.total_blocks ?? 0)}
                        </span>
                    </span>
                </div>
            )}
            <section aria-label="Block distribution" className="space-y-5">
                <h3 className="statistics-insight-label">Block distribution</h3>
                {used.length > 0 || showAll ? (
                    <StatisticsBars
                        items={showAll ? blocks : used.slice(0, 6)}
                        total={data.total_blocks ?? 0}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No blocks yet.
                    </p>
                )}
                <button
                    type="button"
                    aria-expanded={showAll}
                    onClick={() => setShowAll(!showAll)}
                    className="statistics-insight-text-button"
                >
                    {showAll ? 'Show top types' : 'Show all types'}
                </button>
            </section>
        </>
    );
}
