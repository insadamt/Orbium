import { widgetIcon } from './widget-icons';
import { element, type sourceControls } from './widget-controls';
import type { RichWidgetMount } from './rich-model';

type RichBlockHeadingOptions = {
    title: string;
    description?: string;
    icon: Parameters<typeof widgetIcon>[0];
};

export function createRichBlockHeading(
    mount: RichWidgetMount,
    toolbar: HTMLElement,
    options: RichBlockHeadingOptions,
) {
    mount.root.classList.add('attachment-player', 'orbium-rich-card');
    toolbar.className = 'attachment-heading orbium-rich-card-heading';
    const icon = element('span', 'attachment-type-icon');
    icon.append(widgetIcon(options.icon, 20));
    const identity = element('div', 'attachment-identity');
    const title = element('div', 'attachment-title', options.title);
    identity.append(title);
    if (options.description)
        identity.append(
            element('span', 'attachment-description', options.description),
        );
    const actions = element('div', 'attachment-actions');
    toolbar.replaceChildren(icon, identity, actions);
    return { icon, title, actions };
}

export function styleRichSourceControls(
    mount: RichWidgetMount,
    controls: ReturnType<typeof sourceControls>,
    options: RichBlockHeadingOptions,
) {
    const group = controls.toolbar.querySelector('[role="group"]');
    const heading = createRichBlockHeading(mount, controls.toolbar, options);
    if (group instanceof HTMLElement) {
        group.className = 'attachment-actions';
        const [edit, preview] = [...group.querySelectorAll('button')];
        for (const [control, label, icon] of [
            [edit, `Edit ${options.title} source`, 'edit'],
            [preview, `Preview ${options.title}`, 'preview'],
        ] as const) {
            if (!control) continue;
            control.className = 'attachment-action';
            control.title = label;
            control.setAttribute('aria-label', label);
            control.replaceChildren(widgetIcon(icon, 17));
        }
        heading.actions.append(group);
    }
    controls.output.classList.add('orbium-rich-card-content');
    controls.input.classList.add('orbium-rich-card-source');
    controls.error.classList.add('orbium-rich-card-error');
    return heading;
}
