import type { EditorView } from '@tiptap/pm/view';
import { isMarkdownPaste, parseMarkdownContent } from './markdown-import';

export function pasteMarkdownIntoEmptyDocument(
    view: EditorView,
    event: ClipboardEvent,
    reportError: (message: string) => void,
): boolean {
    const clipboard = event.clipboardData;
    const source = clipboard?.getData('text/plain') ?? '';
    const hasEmptyParagraph =
        view.state.doc.childCount === 1 &&
        view.state.doc.firstChild?.type.name === 'paragraph' &&
        view.state.doc.firstChild.content.size === 0;
    if (
        !hasEmptyParagraph ||
        !clipboard ||
        clipboard.files.length > 0 ||
        !isMarkdownPaste(source)
    ) {
        return false;
    }
    try {
        const content = parseMarkdownContent(source);
        const importedDocument = view.state.schema.nodeFromJSON(content);
        view.dispatch(
            view.state.tr.replaceWith(
                0,
                view.state.doc.content.size,
                importedDocument.content,
            ),
        );
        reportError('');
    } catch (failure) {
        reportError(
            failure instanceof Error
                ? failure.message
                : 'Could not paste the Markdown content.',
        );
    }
    return true;
}
