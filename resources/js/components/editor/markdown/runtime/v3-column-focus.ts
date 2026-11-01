// Summary: Routes owner focus inside hidden layout source into its visible column projection; depends on registered V3 columns and defers focus until the current view update completes.
import { ViewPlugin } from '@codemirror/view';
import { focusV3OwnerColumnSelection } from '../columns/v3/v3-column-registry';

export const v3ColumnFocus = ViewPlugin.define((view) => {
    let scheduled = false;
    let destroyed = false;
    const focus = () => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            if (!destroyed && view.root.activeElement === view.contentDOM)
                focusV3OwnerColumnSelection(view);
        });
    };
    view.contentDOM.addEventListener('focus', focus);
    return {
        update(update) {
            if (update.selectionSet) focus();
        },
        destroy() {
            destroyed = true;
            view.contentDOM.removeEventListener('focus', focus);
        },
    };
});
