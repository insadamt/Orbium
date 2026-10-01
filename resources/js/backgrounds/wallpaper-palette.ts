import type { CSSProperties } from 'react';
import type { BackgroundKind } from './background-preferences';
import { findReactBitsEffect } from './react-bits-catalog';

function previewColors(kind: BackgroundKind): string[] {
    if (kind === 'default') return ['#0d1012', '#353b40', '#b9bfc2'];
    if (kind === 'ghost') return ['#101019', '#74748d', '#9b9baa'];
    if (kind === 'molten') return ['#0d1012', '#404047', '#ffffff'];
    const defaults = findReactBitsEffect(kind)?.defaults;
    const colors = Object.values(defaults ?? {})
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter(
            (value): value is string =>
                typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value),
        );
    return colors.length > 0 ? colors.slice(0, 3) : ['#0d1012', '#64748b'];
}

export function previewStyle(kind: BackgroundKind): CSSProperties {
    const colors = previewColors(kind);
    return {
        background: `radial-gradient(circle at 70% 35%, ${colors[1] ?? colors[0]} 0%, transparent 48%), linear-gradient(135deg, ${colors[0]}, ${colors[2] ?? colors[0]})`,
    };
}
