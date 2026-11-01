// Summary: Gives menu and keyboard block copies the same native payload using standard HTML/plain clipboard formats; depends on scoped V3 clipboard validation and the existing block selection.
import { Facet } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { selectedV3BlockClipboard } from '../editing/v3-editing-clipboard';
import { v3ClipboardMime } from '../editing/v3-paste-source';
import { selectedV3ProductIds } from './v3-product-commands';

export const v3ClipboardScope = Facet.define<string, string>({
    combine: (values) => values[0] ?? '',
});

export function v3ClipboardHtml(native: string, plain: string) {
    const escape = (value: string) =>
        value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    return `<div data-orbium-v3="${encodeURIComponent(native)}"><pre>${escape(plain)}</pre></div>`;
}

export function readV3NativeClipboard(data: DataTransfer) {
    const native = data.getData(v3ClipboardMime);
    if (native) return native;
    const html = data.getData('text/html');
    //
    // Read only our encoded attribute; never execute or import the clipboard's HTML as document content.
    //
    if (html.length > 24 * 1024 * 1024) return undefined;
    const encoded = /data-orbium-v3="([^"]+)"/.exec(html)?.[1];
    if (!encoded) return undefined;
    try {
        return decodeURIComponent(encoded);
    } catch {
        return undefined;
    }
}

export async function copyV3MenuBlocks(view: EditorView, id: string) {
    const clipboard = selectedV3BlockClipboard(
        view.state,
        view.state.facet(v3ClipboardScope),
        selectedV3ProductIds(view, id),
    );
    if (!clipboard) return;
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write)
        throw new Error(
            'Use the block handle and Ctrl/Cmd+C to copy this block with its formatting.',
        );
    await navigator.clipboard.write([
        new ClipboardItem({
            'text/plain': new Blob([clipboard.plain], { type: 'text/plain' }),
            'text/html': new Blob(
                [v3ClipboardHtml(clipboard.native, clipboard.plain)],
                { type: 'text/html' },
            ),
        }),
    ]);
}
