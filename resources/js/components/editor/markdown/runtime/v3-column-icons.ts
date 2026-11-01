// Summary: Mounts the existing inline icon picker in each disposable V3 column view; depends on the shared picker service and rich owner context so column-local insertion coordinates remain local.
import { ViewPlugin } from '@codemirror/view';
import { mountMarkdownInlineIcons } from '@/components/inline-icons/markdown-inline-icon-input';
import type { RichContext } from '../rich/rich-model';

export function v3ColumnIcons(context: RichContext) {
    return ViewPlugin.define((view) => {
        const dispose = mountMarkdownInlineIcons(
            view.dom.parentElement ?? view.dom,
            view,
            context,
        );
        return {
            destroy() {
                queueMicrotask(dispose);
            },
        };
    });
}
