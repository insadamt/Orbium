import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as Menu from '@/components/ui/dropdown-menu';

type Props = {
    position: { x: number; y: number; direction?: 'ltr' | 'rtl' };
    label: string;
    onClose: () => void;
    returnFocusTo?: HTMLElement | null;
    className?: string;
    children: ReactNode;
    blockContextMenu?: boolean;
    onRestoreFocus?: () => void;
};

export function PositionedMenu({
    position,
    label,
    onClose,
    returnFocusTo,
    className,
    children,
    blockContextMenu,
    onRestoreFocus,
}: Props) {
    const previousFocus = useRef<HTMLElement | null>(
        returnFocusTo ??
            (typeof document === 'undefined'
                ? null
                : (document.activeElement as HTMLElement | null)),
    );
    useLayoutEffect(() => {
        const closeOnViewportChange = (event: Event) => {
            if (
                event.target instanceof Element &&
                event.target.closest('[data-app-menu-content]')
            )
                return;
            onClose();
        };
        window.addEventListener('scroll', closeOnViewportChange, true);
        window.addEventListener('resize', closeOnViewportChange);
        return () => {
            window.removeEventListener('scroll', closeOnViewportChange, true);
            window.removeEventListener('resize', closeOnViewportChange);
        };
    }, [onClose, returnFocusTo]);

    return (
        <Menu.Root
            open
            modal={false}
            dir={position.direction}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <Menu.Trigger
                aria-hidden="true"
                tabIndex={-1}
                style={{
                    position: 'fixed',
                    left: position.x,
                    top: position.y,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                }}
            />
            <Menu.Content
                data-block-context-menu={blockContextMenu || undefined}
                aria-label={label}
                align="start"
                sideOffset={2}
                collisionPadding={8}
                className={className}
                onContextMenu={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    if (onRestoreFocus) onRestoreFocus();
                    else previousFocus.current?.focus({ preventScroll: true });
                }}
            >
                {children}
            </Menu.Content>
        </Menu.Root>
    );
}
