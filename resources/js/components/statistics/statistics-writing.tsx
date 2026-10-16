import { Type } from 'lucide-react';
import type { StatisticsSummary } from './statistics-types';
import {
    formatAverage,
    formatCount,
    StatisticsSection,
} from './statistics-charts';

export function StatisticsWriting({ data }: { data: StatisticsSummary }) {
    const isDocument = data.scope.kind === 'document';
    return (
        <StatisticsSection
            title="Writing"
            icon={Type}
            description={
                isDocument
                    ? 'How much writing is in this document?'
                    : 'How much writing is in this space?'
            }
        >
            {data.writing ? (
                <>
                    <dl
                        className={`grid gap-6 ${isDocument ? '' : 'sm:grid-cols-2'}`}
                    >
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Total words
                            </dt>
                            <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                                {formatCount(data.writing.words)}
                            </dd>
                        </div>
                        {!isDocument && (
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Average words per document
                                </dt>
                                <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                                    {formatAverage(
                                        data.writing.words,
                                        data.content.documents,
                                    )}
                                </dd>
                                <dd className="mt-1 text-xs text-muted-foreground">
                                    Across {formatCount(data.content.documents)}{' '}
                                    documents, including empty ones.
                                </dd>
                            </div>
                        )}
                    </dl>
                    <details className="statistics-details">
                        <summary>Character counts</summary>
                        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    With spaces
                                </dt>
                                <dd className="mt-1 font-medium tabular-nums">
                                    {formatCount(data.writing.characters)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Without spaces
                                </dt>
                                <dd className="mt-1 font-medium tabular-nums">
                                    {formatCount(
                                        data.writing.characters_without_spaces,
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </details>
                </>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Writing totals will appear when statistics are ready.
                </p>
            )}
        </StatisticsSection>
    );
}
