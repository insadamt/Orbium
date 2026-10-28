import { renderRichBody } from '@/components/editor/markdown/rich/render-rich-body';
import { mountTableFullscreenView } from '@/components/editor/markdown/rich/table-fullscreen-view';
import { element } from '@/components/editor/markdown/rich/widget-controls';
import type { RichContext } from '@/components/editor/markdown/rich/rich-model';
import { boardTableSource, readBoardTable } from './board-table-data';
import type { BoardBlockData, BoardInline, BoardLocation } from './board-types';
import type { BoardWorkScheduler } from './board-work-scheduler';
import { createBoardRichPreviewQueue } from './board-rich-preview-queue';
import { BoardMermaidPreviewSession } from './board-mermaid-preview-session';
import type { BoardPreparedPreviews } from './board-prepared-previews';

export function mountBoardTablePreview({
    root,
    data,
    location,
    scheduler,
    prepared,
}: {
    root: HTMLElement;
    data: BoardBlockData;
    location: BoardLocation;
    scheduler: BoardWorkScheduler;
    prepared: BoardPreparedPreviews;
}) {
    const nativeRows =
        data.table_source === undefined &&
        data.rows?.every((row) =>
            row.every((cell) =>
                cell.every(
                    (inline) =>
                        inline.type !== 'inlineIcon' && !inline.marks?.length,
                ),
            ),
        )
            ? data.rows
            : null;
    const block = nativeRows ? null : readBoardTable(boardTableSource(data));
    if (!nativeRows && !block?.table) return () => {};
    let mermaid: BoardMermaidPreviewSession | undefined;
    const richQueue = createBoardRichPreviewQueue(root, scheduler);
    const context: RichContext = {
        workspaceId: location.workspaceId,
        nodeId: location.boardId,
        ownerKind: 'board',
        //
        // Plain read-only tables need neither a source editor nor a diagram session; rich cells create a session only when used.
        //
        get mermaid() {
            if (!mermaid) {
                mermaid = new BoardMermaidPreviewSession(
                    {
                        workspaceId: location.workspaceId,
                        nodeId: location.boardId,
                        ownerKind: 'board',
                    },
                    prepared,
                );
                mermaid.start(root);
            }
            return mermaid;
        },
        schedulePreview: (element, render) =>
            richQueue.enqueue(element, render),
        metadata: new Map(),
        mathPreviewScope: prepared.mathScope,
        isVisible: () => root.isConnected,
        onUpload: () => {},
    };
    const frame = element('div', 'orbium-table-frame');
    const scroller = element('div', 'tableWrapper overflow-x-auto');
    const grid = element('table', 'orbium-table orbium-rich-table');
    const body = element('tbody');
    const disposals: (() => void)[] = [];
    grid.append(body);
    scroller.append(grid);
    frame.append(scroller);
    root.append(frame);
    if (nativeRows) appendNativeTableRows(body, nativeRows);
    for (const row of block?.table?.rows ?? []) {
        const tr = element('tr');
        body.append(tr);
        row.forEach((cell, column) => {
            const td = element(cell.metadata.header ? 'th' : 'td', 'align-top');
            td.colSpan = Number(cell.metadata.colspan ?? 1);
            td.rowSpan = Number(cell.metadata.rowspan ?? 1);
            td.style.textAlign = String(
                cell.metadata.align ?? block?.table?.alignments[column] ?? '',
            );
            const widths = cell.metadata.colwidth as number[] | undefined;
            if (widths?.some(Boolean))
                td.style.width = `${widths.reduce((sum, width) => sum + width, 0)}px`;
            const content = element('div', 'orbium-table-cell-content');
            const output = element('div', 'min-h-7');
            content.append(output);
            td.append(content);
            tr.append(td);
            disposals.push(
                renderRichBody(
                    output,
                    cell.source.replace(/\\\|/g, '|'),
                    context,
                    () => {},
                ),
            );
        });
    }
    const edges = element('div', 'orbium-table-edges');
    frame.append(edges);
    const fullscreen = mountTableFullscreenView({
        edges,
        grid,
        beforeOpen: () => {},
    });
    return () => {
        richQueue.destroy();
        fullscreen.destroy();
        disposals.forEach((dispose) => dispose());
        mermaid?.destroy();
        frame.remove();
    };
}

function appendNativeTableRows(body: HTMLElement, rows: BoardInline[][][]) {
    //
    // Plain native cells already contain literal text. Round-tripping them through Markdown and CodeMirror per cell only reconstructs the same paragraph.
    //
    rows.forEach((row, index) => {
        const tr = element('tr');
        body.append(tr);
        for (const cell of row) {
            const td = element(index === 0 ? 'th' : 'td', 'align-top');
            const content = element('div', 'orbium-table-cell-content');
            const output = element('div', 'min-h-7');
            if (cell.length) {
                const paragraph = element('p');
                for (const inline of cell)
                    paragraph.append(
                        inline.type === 'hardBreak'
                            ? element('br')
                            : document.createTextNode(inline.text ?? ''),
                    );
                output.append(paragraph);
            }
            content.append(output);
            td.append(content);
            tr.append(td);
        }
    });
}
