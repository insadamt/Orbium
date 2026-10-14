import TaskItem from '@tiptap/extension-task-item';
import { mountPlayfulTaskCheckbox } from './playful-task-checkbox';

export const PlayfulTaskItem = TaskItem.extend({
    addNodeView() {
        const createTaskItemView = this.parent!();
        if (!createTaskItemView) return null;
        return (props) => {
            const view = createTaskItemView(props);
            const input = (view.dom as HTMLElement).querySelector('input');
            if (input) mountPlayfulTaskCheckbox(input);
            return view;
        };
    },
});
