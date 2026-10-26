import { EditorView } from '@codemirror/view';

export function markdownImportPaste(importSource: (source: string) => unknown) {
    return EditorView.domEventHandlers({
        paste(event, view) {
            if (
                !view.state.facet(EditorView.editable) ||
                view.state.doc.toString().trim() ||
                event.clipboardData?.files.length ||
                (event.target instanceof Element &&
                    event.target.closest('textarea, input'))
            )
                return false;
            const text = event.clipboardData?.getData('text/plain') ?? '';
            if (
                !/^(?:#{1,6} |[-*+] |\d+\. |> |`{3,}|:{3,}orbium |\$\$)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/m.test(
                    text,
                )
            )
                return false;
            event.preventDefault();
            void importSource(text);
            return true;
        },
    });
}
