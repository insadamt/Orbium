import type { ReactNode } from 'react';
import { Blocks, Database, FileText, Folder } from 'lucide-react';
import type { StatisticsSummary } from './statistics-types';
import { formatCount, StatisticsSection } from './statistics-charts';

export function StatisticsContent({
    data,
    action,
}: {
    data: StatisticsSummary;
    action?: ReactNode;
}) {
    if (data.scope.kind === 'document') return null;
    const items = [
        { label: 'Documents', value: data.content.documents, icon: FileText },
        { label: 'Folders', value: data.content.folders, icon: Folder },
        { label: 'Databases', value: data.content.databases, icon: Database },
        { label: 'Workspaces', value: data.content.workspaces, icon: Blocks },
    ].filter((item) => item.value !== null);
    return (
        <StatisticsSection title="Content" icon={Folder} action={action}>
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
        </StatisticsSection>
    );
}
