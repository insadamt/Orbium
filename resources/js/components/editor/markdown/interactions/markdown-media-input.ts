import { uploadKindForMime } from '@/components/media/attachment-media';
import { EditorView } from '@codemirror/view';
import { markdownBlockAt } from './markdown-block-actions';
import { isMarkdownLiteralPosition } from '../markdown-syntax';
import type { MarkdownUploadRequest } from '../markdown-slash-commands';

export function markdownMediaInput(
    upload: (files: File[], request: MarkdownUploadRequest) => Promise<void>,
    notice: (message: string) => void,
) {
    const insertFiles = (
        view: EditorView,
        files: File[],
        position: number,
        to = position,
    ) => {
        if (
            !files.length ||
            !view.state.facet(EditorView.editable) ||
            view.compositionStarted
        )
            return false;
        notice('');
        if (isMarkdownLiteralPosition(view.state, position)) {
            position = markdownBlockAt(view.state, position).to;
            to = position;
        }
        void upload(files, {
            view,
            from: position,
            to,
            kind: uploadKindForMime(files[0].type),
        });
        return true;
    };
    return EditorView.domEventHandlers({
        paste(event, view) {
            if (
                !event.clipboardData?.files.length ||
                (event.target !== view.contentDOM &&
                    !(
                        event.target instanceof Node &&
                        view.contentDOM.contains(event.target)
                    ))
            )
                return false;
            const handled = insertFiles(
                view,
                [...event.clipboardData.files],
                view.state.selection.main.from,
                view.state.selection.main.to,
            );
            if (handled) event.preventDefault();
            return handled;
        },
        dragover(event, view) {
            if (
                event.dataTransfer?.types.includes('Files') &&
                view.state.facet(EditorView.editable)
            ) {
                event.preventDefault();
                return true;
            }
            return false;
        },
        drop(event, view) {
            if (
                !event.dataTransfer?.files.length ||
                (event.target instanceof Element &&
                    event.target.closest('textarea, input, button, select'))
            )
                return false;
            const position =
                view.posAtCoords({ x: event.clientX, y: event.clientY }) ??
                view.state.selection.main.head;
            const handled = insertFiles(
                view,
                [...event.dataTransfer.files],
                position,
            );
            if (handled) event.preventDefault();
            return handled;
        },
    });
}
