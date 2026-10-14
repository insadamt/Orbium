import { createRoot } from 'react-dom/client';
import { AppSelect } from './app-select';

export function mountAppSelect(select: HTMLSelectElement) {
    const host = document.createElement('span');
    host.className = 'inline-flex min-w-0';
    select.replaceWith(host);
    const root = createRoot(host);
    let destroyed = false;
    function update() {
        if (destroyed) return;
        root.render(
            <AppSelect
                label={select.getAttribute('aria-label') ?? 'Select option'}
                value={select.value}
                disabled={select.disabled}
                className="min-h-7 border-0 bg-transparent px-2 py-1 text-xs shadow-none"
                options={Array.from(select.options, (option) => ({
                    value: option.value,
                    label: option.text,
                    disabled: option.disabled,
                }))}
                onValueChange={(value) => {
                    select.value = value;
                    select.dispatchEvent(
                        new Event('change', { bubbles: true }),
                    );
                    update();
                }}
            />,
        );
    }
    update();
    return {
        update,
        destroy() {
            destroyed = true;
            host.remove();
            queueMicrotask(() => root.unmount());
        },
    };
}
