import { Database, FileText, Folder } from 'lucide-react';
import { StatisticsCompositionChart } from './statistics-composition-chart';
import {
    StatisticsInsightTotal,
    StatisticsInsightValues,
} from './statistics-insight-values';
import {
    StatisticsBars,
    formatAverage,
    formatCount,
    formatShare,
} from './statistics-charts';
import type { StatisticsSummary } from './statistics-types';

export function StatisticsWritingInsights({
    data,
}: {
    data: StatisticsSummary;
}) {
    const writing = data.writing;
    if (!writing)
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Writing totals pending.
            </p>
        );
    const spaces = Math.max(
        0,
        writing.characters - writing.characters_without_spaces,
    );
    return (
        <>
            <StatisticsInsightTotal
                label="Words"
                value={formatCount(writing.words)}
            />
            <StatisticsInsightValues
                items={[
                    {
                        label: 'Characters',
                        value: formatCount(writing.characters),
                    },
                    {
                        label: 'Without spaces',
                        value: formatCount(writing.characters_without_spaces),
                    },
                    ...(data.scope.kind === 'document'
                        ? []
                        : [
                              {
                                  label: 'Words / document',
                                  value: formatAverage(
                                      writing.words,
                                      data.content.documents,
                                  ),
                              },
                          ]),
                ]}
            />
            <StatisticsCompositionChart
                label="Character composition"
                totalValue={formatCount(writing.characters)}
                totalLabel="Characters"
                items={[
                    {
                        label: 'Without spaces',
                        value: writing.characters_without_spaces,
                        formattedValue: formatCount(
                            writing.characters_without_spaces,
                        ),
                    },
                    {
                        label: 'Spaces',
                        value: spaces,
                        formattedValue: formatCount(spaces),
                    },
                ]}
            />
        </>
    );
}

export function StatisticsTaskInsights({ data }: { data: StatisticsSummary }) {
    const tasks = data.checklist;
    if (!tasks)
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Task totals pending.
            </p>
        );
    const total = tasks.checked + tasks.unchecked;
    return (
        <>
            <StatisticsInsightTotal
                label="Checklist items"
                value={formatCount(total)}
            />
            <StatisticsCompositionChart
                label="Completion"
                totalValue={formatShare(tasks.checked, total)}
                totalLabel="Complete"
                items={[
                    {
                        label: 'Completed',
                        value: tasks.checked,
                        formattedValue: formatCount(tasks.checked),
                    },
                    {
                        label: 'Remaining',
                        value: tasks.unchecked,
                        formattedValue: formatCount(tasks.unchecked),
                    },
                ]}
            />
            {total === 0 && (
                <p className="text-sm text-muted-foreground">
                    No checklist items yet.
                </p>
            )}
        </>
    );
}

export function StatisticsOrganizationInsights({
    data,
}: {
    data: StatisticsSummary;
}) {
    const items = [
        { label: 'Documents', value: data.content.documents, icon: FileText },
        ...(data.content.folders === null
            ? []
            : [
                  {
                      label: 'Folders',
                      value: data.content.folders,
                      icon: Folder,
                  },
              ]),
        ...(data.content.databases === null
            ? []
            : [
                  {
                      label: 'Databases',
                      value: data.content.databases,
                      icon: Database,
                  },
              ]),
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);
    return (
        <>
            <StatisticsInsightTotal
                label="Content items"
                value={formatCount(total)}
            />
            {data.content.workspaces !== null && (
                <StatisticsInsightValues
                    items={[
                        {
                            label: 'Workspaces',
                            value: formatCount(data.content.workspaces),
                        },
                    ]}
                />
            )}
            <section aria-label="Content by type" className="space-y-5">
                <h3 className="statistics-insight-label">By type</h3>
                <StatisticsBars items={items} total={total} />
            </section>
            {data.content.database_entries !== null && (
                <p className="text-xs text-muted-foreground">
                    {formatCount(data.content.database_entries)} database
                    entries, included in Documents.
                </p>
            )}
        </>
    );
}
