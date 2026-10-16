import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export const formatCount = (value: number | null | undefined) =>
    value == null ? '—' : value.toLocaleString();

export function formatStorage(bytes: number) {
    if (bytes === 0) return '0 B';
    const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4);
    return `${(bytes / 1024 ** unit).toLocaleString(undefined, { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${['B', 'KB', 'MB', 'GB', 'TB'][unit]}`;
}

export function formatShare(value: number, total: number) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return percentage > 0 && percentage < 1
        ? '<1%'
        : `${Math.round(percentage)}%`;
}

export function formatAverage(total: number | null | undefined, count: number) {
    return total == null || count === 0
        ? '—'
        : (total / count).toLocaleString(undefined, {
              maximumFractionDigits: 1,
          });
}

export function StatisticsSection({
    title,
    icon: Icon,
    children,
    action,
}: {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <section className="statistics-section">
            <header className="statistics-section-header">
                <Icon
                    size={19}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                />
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                        {title}
                    </h2>
                </div>
                {action && <div className="ml-auto">{action}</div>}
            </header>
            {children}
        </section>
    );
}

type BarItem = { label: string; value: number; icon: LucideIcon };

export function StatisticsBars({
    items,
    total,
}: {
    items: BarItem[];
    total: number;
}) {
    const maximum = Math.max(...items.map((item) => item.value), 0);
    return (
        <dl className="space-y-5">
            {items.map(({ label, value, icon: Icon }) => (
                <div key={label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <dt className="flex min-w-0 items-center gap-2">
                            <Icon
                                size={15}
                                className="shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            {label}
                        </dt>
                        <dd className="flex shrink-0 items-baseline gap-3 tabular-nums">
                            <span className="font-medium">
                                {formatCount(value)}
                            </span>
                            <span className="w-10 text-right text-xs text-muted-foreground">
                                {formatShare(value, total)}
                            </span>
                        </dd>
                    </div>
                    <div
                        aria-hidden="true"
                        className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                        <div
                            className="h-full rounded-full bg-foreground/65"
                            style={{
                                width: `${maximum > 0 ? (value / maximum) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </dl>
    );
}
