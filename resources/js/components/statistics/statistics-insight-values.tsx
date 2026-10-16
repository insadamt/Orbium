export function StatisticsInsightValues({
    items,
}: {
    items: { label: string; value: string }[];
}) {
    return (
        <dl className="statistics-insight-values">
            {items.map(({ label, value }) => (
                <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-2 text-xl font-semibold break-words tabular-nums">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function StatisticsInsightTotal({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="statistics-insight-label">{label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight break-words tabular-nums">
                {value}
            </p>
        </div>
    );
}
