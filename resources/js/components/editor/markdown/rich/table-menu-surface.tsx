import { createRoot } from 'react-dom/client';
import { useLayoutEffect, useRef } from 'react';
import { PositionedMenu } from '@/components/ui/positioned-menu';
import * as Menu from '@/components/ui/dropdown-menu';
import { widgetIcon } from './widget-icons';

export type TableMenuAction = {
    label: string;
    icon: Parameters<typeof widgetIcon>[0];
    run: () => void;
    disabled: boolean;
};

function TableMenuIcon({ name }: { name: TableMenuAction['icon'] }) {
    const container = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        container.current?.replaceChildren(widgetIcon(name, 16));
    }, [name]);
    return <span ref={container} aria-hidden="true" />;
}

export function createTableMenuSurface(host: HTMLElement) {
    const root = createRoot(host);
    return {
        open(
            anchor: HTMLButtonElement,
            label: string,
            actions: TableMenuAction[],
            onClose: () => void,
        ) {
            const bounds = anchor.getBoundingClientRect();
            root.render(
                <PositionedMenu
                    position={{ x: bounds.left, y: bounds.bottom }}
                    label={label}
                    onClose={onClose}
                    returnFocusTo={anchor}
                    className="orbium-table-action-menu"
                >
                    {actions.map((action) => (
                        <Menu.Item
                            key={action.label}
                            disabled={action.disabled}
                            variant={
                                action.label.startsWith('Delete')
                                    ? 'destructive'
                                    : 'default'
                            }
                            onSelect={action.run}
                        >
                            <TableMenuIcon name={action.icon} /> {action.label}
                        </Menu.Item>
                    ))}
                </PositionedMenu>,
            );
        },
        close() {
            root.render(null);
        },
        destroy() {
            queueMicrotask(() => root.unmount());
        },
    };
}
