import { parse, walk } from 'css-tree';
import {
    blockStyleTypes,
    type BlockStyleType,
    type EditorStyles,
} from './block-style-types';
import type { StyleSource } from './style-diagnostics';

export const styleNavigationGroups: {
    title: string;
    sources: StyleSource[];
}[] = [
    { title: 'Theme', sources: ['base'] },
    {
        title: 'Text',
        sources: ['paragraph', 'heading-1', 'heading-2', 'heading-3'],
    },
    { title: 'Lists', sources: ['bullet-list', 'ordered-list', 'checklist'] },
    {
        title: 'Containers',
        sources: ['quote', 'callout', 'code', 'table', 'divider'],
    },
    { title: 'Media', sources: ['image', 'file', 'mermaid', 'math'] },
];

export function styleSourceLabel(source: StyleSource): string {
    return source === 'base'
        ? 'Base stylesheet'
        : blockStyleTypes.find(([type]) => type === source)![1];
}

export function exampleDeclarations(type: BlockStyleType): string {
    if (type.startsWith('heading'))
        return 'color: var(--foreground);\nletter-spacing: 0.01em;';
    if (type === 'paragraph')
        return 'line-height: 1.8;\ncolor: var(--foreground);';
    if (type === 'divider')
        return 'border-color: var(--border);\nmargin-block: 24px;';
    return 'background-color: var(--muted);\npadding: 12px;\nborder-radius: 8px;';
}

export function exampleSource(source: StyleSource): string {
    const declarations = exampleDeclarations(
        source === 'base' ? 'quote' : source,
    );
    return source === 'base'
        ? `.orbium-quote {\n${declarations
              .split('\n')
              .map((line) => `  ${line}`)
              .join('\n')}\n}`
        : declarations;
}

export function customizedBlockCount(styles: EditorStyles): number {
    const customized = new Set(
        blockStyleTypes
            .filter(([type]) => styles.overrides[type]?.trim())
            .map(([type]) => `orbium-${type}`),
    );
    const knownClasses = new Set(
        blockStyleTypes.map(([type]) => `orbium-${type}`),
    );
    try {
        walk(parse(styles.stylesheet, { parseValue: false }), (node) => {
            if (
                node.type === 'ClassSelector' &&
                knownClasses.has(node.name as `orbium-${BlockStyleType}`)
            )
                customized.add(node.name as `orbium-${BlockStyleType}`);
        });
    } catch {
        return customized.size;
    }
    return customized.size;
}
