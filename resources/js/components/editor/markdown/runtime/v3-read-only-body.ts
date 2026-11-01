// Summary: Renders identified Document bodies and responsive columns for hosted previews without leaking headers; depends on V3 structure and the existing safe rich body renderer supplied by the caller.
import { parseV3Structure } from '../structure/v3-structure-parser';
import type { RichContext } from '../rich/rich-model';

type BodyRenderer = (
    output: HTMLElement,
    source: string,
    context: RichContext,
    measure: () => void,
    depth: number,
) => () => void;
export function renderV3ReadOnlyBody(options: {
    output: HTMLElement;
    source: string;
    context: RichContext;
    measure: () => void;
    depth: number;
    render: BodyRenderer;
}): (() => void) | null {
    const { output, source, context, measure, depth, render } = options;
    if (!/^\s*\+\+block[ \t]/.test(source)) return null;
    const structure = parseV3Structure(source);
    if (structure.diagnostics.length) {
        output.textContent =
            'This Document has invalid V3 structure. Open Source mode to repair it.';
        return () => {};
    }
    const disposals: (() => void)[] = [];
    const renderBlock = (
        parent: HTMLElement,
        block: (typeof structure.blocks)[number],
    ) => {
        const target = document.createElement('div');
        target.dataset.documentFrom = String(block.bodyFrom);
        target.dataset.documentTo = String(block.bodyTo);
        target.dataset.blockId = block.id;
        parent.append(target);
        if (block.type === 'spacer') {
            target.className = 'orbium-spacer-block';
            target.setAttribute('aria-hidden', 'true');
            return;
        }
        if (block.type !== 'columns') {
            disposals.push(
                render(
                    target,
                    source.slice(block.bodyFrom, block.bodyTo),
                    {
                        ...context,
                        documentSourceRanges: false,
                        v3BlockType: block.type,
                    },
                    measure,
                    depth + 1,
                ),
            );
            return;
        }
        target.className = 'orbium-rich-block orbium-columns-block';
        const directive = structure.directives.find(
            (item) =>
                item.blockId === block.id && item.metadata.kind === 'columns',
        )!;
        const widths = directive.metadata.widths as number[];
        const grid = document.createElement('div');
        grid.className = 'orbium-columns-grid';
        grid.dir = 'ltr';
        grid.dataset.columnCount = String(widths.length);
        grid.style.gridTemplateColumns = widths
            .map((width) => `minmax(0, ${width}fr)`)
            .join(' 20px ');
        target.append(grid);
        structure.columns
            .filter((column) => column.layoutId === block.id)
            .forEach((column, index) => {
                if (index) {
                    const divider = document.createElement('div');
                    divider.className = 'orbium-column-divider';
                    grid.append(divider);
                }
                const host = document.createElement('div');
                host.className = 'orbium-column';
                host.dir = 'auto';
                grid.append(host);
                structure.blocks
                    .filter((child) => child.parentId === column.id)
                    .forEach((child) => renderBlock(host, child));
            });
    };
    structure.blocks
        .filter((block) => block.parentId === null)
        .forEach((block) => renderBlock(output, block));
    return () => disposals.reverse().forEach((dispose) => dispose());
}
