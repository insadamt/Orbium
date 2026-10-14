import { mountCompletionMenuReveal } from './markdown-completion-reveal';
import {
    getTooltip,
    showTooltip,
    ViewPlugin,
    type EditorView,
    type TooltipView,
} from '@codemirror/view';
import { mountMenuHighlight } from '@/lib/menu-highlight';
import { widgetIcon } from '../rich/widget-icons';
import {
    selectedCompletionIndex,
    setSelectedCompletion,
    type Completion,
} from '@codemirror/autocomplete';

const completionIcons: Record<string, Parameters<typeof widgetIcon>[0]> = {
    Text: 'text',
    'Heading 1': 'heading',
    'Heading 2': 'heading',
    'Heading 3': 'heading',
    'Bullet list': 'list',
    'Numbered list': 'list',
    Checklist: 'checklist',
    Quote: 'quote',
    Code: 'code',
    Mermaid: 'code',
    Divider: 'divider',
    'Math block': 'math',
    'Inline math': 'math',
    Table: 'table',
    Image: 'image',
    File: 'file',
};

export function completionMenuIcon(completion: Completion) {
    const icon = widgetIcon(completionIcons[completion.label] ?? 'plus', 16);
    icon.classList.add('app-menu-option-icon');
    icon.setAttribute('aria-hidden', 'true');
    return icon;
}

export const markdownCompletionMenu = ViewPlugin.fromClass(
    class {
        private mountedMenus = new Map<HTMLElement, () => void>();
        private pending = false;
        private destroyed = false;
        constructor(private view: EditorView) {
            this.scheduleSynchronization();
        }
        update() {
            this.scheduleSynchronization();
        }
        private scheduleSynchronization() {
            if (this.pending) return;
            this.pending = true;
            // Tooltips mount after view plugins update and can be portaled outside the editor.
            queueMicrotask(() => {
                this.pending = false;
                if (!this.destroyed) this.synchronizeMenus();
            });
        }
        private synchronizeMenus() {
            const menus = new Map<HTMLElement, TooltipView>();
            for (const tooltip of this.view.state.facet(showTooltip)) {
                if (!tooltip) continue;
                const tooltipView = getTooltip(this.view, tooltip);
                if (tooltipView?.dom.matches('.orbium-slash-menu'))
                    menus.set(tooltipView.dom, tooltipView);
            }
            for (const [menu, dispose] of this.mountedMenus) {
                if (!menus.has(menu)) {
                    dispose();
                    this.mountedMenus.delete(menu);
                }
            }
            for (const [menu, tooltipView] of menus) {
                if (this.mountedMenus.has(menu)) continue;
                const disposeReveal = mountCompletionMenuReveal(tooltipView);
                const disposeHighlight = mountMenuHighlight(menu, {
                    itemSelector: '[role="option"]',
                    selectedSelector: '[aria-selected="true"]',
                });
                const selectHoveredOption = (event: PointerEvent) => {
                    const option =
                        event.target instanceof Element
                            ? event.target.closest('[role="option"]')
                            : null;
                    const match = option && /-(\d+)$/.exec(option.id);
                    if (!match) return;
                    const index = Number(match[1]);
                    if (index !== selectedCompletionIndex(this.view.state))
                        this.view.dispatch({
                            effects: setSelectedCompletion(index),
                        });
                };
                menu.addEventListener('pointermove', selectHoveredOption);
                this.mountedMenus.set(menu, () => {
                    menu.removeEventListener(
                        'pointermove',
                        selectHoveredOption,
                    );
                    disposeReveal();
                    disposeHighlight();
                });
            }
        }
        destroy() {
            this.destroyed = true;
            this.mountedMenus.forEach((dispose) => dispose());
            this.mountedMenus.clear();
        }
    },
);
