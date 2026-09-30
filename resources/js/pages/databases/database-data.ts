import type { DatabaseDocument, Filter, Property, Sort, Value } from './types';

export function displayValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    )
        return String(value);
    if (Array.isArray(value)) return value.map(displayValue).join(', ');
    return '';
}

export function valueFor(
    values: Value[],
    documentId: number,
    propertyId: number,
): unknown {
    return values.find(
        (item) =>
            item.document_node_id === documentId &&
            item.property_id === propertyId,
    )?.value;
}

export function visibleDocuments(
    documents: DatabaseDocument[],
    properties: Property[],
    values: Value[],
    filters: Filter[],
    sorts: Sort[],
): DatabaseDocument[] {
    const filtered = documents.filter((document) =>
        filters.every((filter) => {
            const property = properties.find(
                (item) => item.id === filter.property_id,
            );
            if (!property) return true;
            const value = valueFor(values, document.id, property.id);
            if (filter.operator === 'is_empty')
                return (
                    value === undefined ||
                    value === null ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0)
                );
            if (filter.operator === 'contains')
                return displayValue(value)
                    .toLocaleLowerCase()
                    .includes(displayValue(filter.value).toLocaleLowerCase());
            const expected =
                property.type === 'number'
                    ? Number(filter.value)
                    : property.type === 'checkbox'
                      ? filter.value === true || filter.value === 'true'
                      : filter.value;
            const matches = Array.isArray(value)
                ? value.includes(expected)
                : value === expected;
            return filter.operator === 'is' ? matches : !matches;
        }),
    );
    return filtered.sort((left, right) => {
        for (const sort of sorts) {
            const leftValue =
                sort.field === 'title'
                    ? left.title
                    : valueFor(values, left.id, Number(sort.field));
            const rightValue =
                sort.field === 'title'
                    ? right.title
                    : valueFor(values, right.id, Number(sort.field));
            const comparison = displayValue(leftValue).localeCompare(
                displayValue(rightValue),
                undefined,
                { numeric: true },
            );
            if (comparison !== 0)
                return sort.direction === 'asc' ? comparison : -comparison;
        }
        return left.id - right.id;
    });
}
