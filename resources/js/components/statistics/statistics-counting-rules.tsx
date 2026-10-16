import { Info } from 'lucide-react';
import type { StatisticsSummary } from './statistics-types';

export function StatisticsCountingRules({ data }: { data: StatisticsSummary }) {
    return (
        <details className="rounded-xl border border-border/60 px-5 py-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-sm">
                <Info size={15} className="mr-2 inline" aria-hidden="true" />
                How these numbers are counted
            </summary>
            <div className="mt-4 space-y-3 leading-relaxed">
                <p>
                    Content excludes Trash and descendants of trashed
                    containers. Writing excludes titles and database properties;
                    whitespace is normalized. Characters are counted as Unicode
                    code points. Per-document averages include empty documents.
                </p>
                <p>
                    List items count individually. Tables count once. Formatting
                    wrappers and empty paragraphs do not add blocks. Inline math
                    is counted separately.
                </p>
                <p>
                    {data.scope.kind === 'account'
                        ? 'Account uploads include unused Library items and uploads retained in trashed workspaces.'
                        : data.scope.kind === 'workspace'
                          ? 'Workspace uploads include unused Library items and uploads retained after content is trashed.'
                          : 'Page uploads include distinct references in saved content, page covers, icons, and database Files values. Containers include descendants.'}{' '}
                    Reusing an upload counts it once. Storage includes original
                    file sizes, excluding caches, thumbnails, and database
                    overhead.
                </p>
                <p>
                    Charts describe the current saved content. Refresh fetches
                    totals without saving an open document or starting
                    statistics processing.
                </p>
            </div>
        </details>
    );
}
