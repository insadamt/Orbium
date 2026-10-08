import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowUp,
    Copy,
    Files,
    Trash2,
} from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { AppSelect } from '@/components/ui/app-select';

export const blockConversions = [
    'Text',
    'Heading 1',
    'Heading 2',
    'Heading 3',
    'Bullet list',
    'Numbered list',
    'Checklist',
    'Quote',
    'Code',
];
export type BlockMenuAction = 'up' | 'down' | 'duplicate' | 'copy' | 'delete';
export type BlockMenuAnchor = {
    x: number;
    y: number;
    direction: 'ltr' | 'rtl';
};
type Props = {
    anchor: BlockMenuAnchor;
    formatting: {
        alignment: string | null;
        direction: string;
        canAlign: boolean;
    };
    canMoveUp: boolean;
    canMoveDown: boolean;
    onClose: () => void;
    onFocusEditor: () => void;
    onConvert: (label: string) => void;
    onAlignment: (alignment: 'left' | 'center' | 'right') => void;
    onDirection: (direction: 'auto' | 'ltr' | 'rtl') => void;
    onAction: (action: BlockMenuAction) => void;
};

export function BlockMenuSurface({
    anchor,
    formatting,
    canMoveUp,
    canMoveDown,
    onClose,
    onFocusEditor,
    onConvert,
    onAlignment,
    onDirection,
    onAction,
}: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const bounds = menu.getBoundingClientRect();
        const preferredLeft =
            anchor.x - (anchor.direction === 'rtl' ? bounds.width : 0);
        menu.style.left = `${Math.max(8, Math.min(preferredLeft, window.innerWidth - bounds.width - 8))}px`;
        menu.style.top = `${Math.max(8, Math.min(anchor.y, window.innerHeight - bounds.height - 8))}px`;
        menu.style.visibility = 'visible';
        menu.querySelector<HTMLButtonElement>('[role="combobox"]')?.focus({
            preventScroll: true,
        });
    }, [anchor]);
    function perform(action: () => void) {
        action();
        onClose();
    }
    return (
        <div
            ref={menuRef}
            role="dialog"
            aria-label="Block options"
            data-block-context-menu
            className="glass-surface fixed z-50 max-h-[calc(100vh-16px)] w-64 overflow-y-auto rounded-xl border border-border p-2 text-sm text-foreground shadow-xl"
            style={{ left: anchor.x, top: anchor.y, visibility: 'hidden' }}
            onKeyDown={(event) => {
                if (
                    event.key === 'Escape' &&
                    !(
                        event.target instanceof Element &&
                        event.target.closest('.block-context-select-content')
                    )
                ) {
                    event.preventDefault();
                    onClose();
                    onFocusEditor();
                }
            }}
            onClick={(event) => event.stopPropagation()}
        >
            <div className="block px-1 text-xs font-medium text-muted-foreground">
                <span>Block type</span>
                <AppSelect
                    label="Turn block into"
                    value=""
                    placeholder="Turn into…"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    contentClassName="block-context-select-content"
                    onValueChange={(value) => perform(() => onConvert(value))}
                    options={blockConversions.map((label) => ({
                        value: label,
                        label,
                    }))}
                />
            </div>

            <fieldset className="mt-3">
                <legend className="px-1 text-xs font-medium text-muted-foreground">
                    Text alignment
                </legend>
                <div className="mt-1 grid grid-cols-3 gap-1">
                    <ChoiceButton
                        label="Left"
                        title="Align left"
                        icon={<AlignLeft size={15} />}
                        active={formatting.alignment === 'left'}
                        disabled={!formatting.canAlign}
                        onClick={() => perform(() => onAlignment('left'))}
                    />
                    <ChoiceButton
                        label="Center"
                        title="Align center"
                        icon={<AlignCenter size={15} />}
                        active={formatting.alignment === 'center'}
                        disabled={!formatting.canAlign}
                        onClick={() => perform(() => onAlignment('center'))}
                    />
                    <ChoiceButton
                        label="Right"
                        title="Align right"
                        icon={<AlignRight size={15} />}
                        active={formatting.alignment === 'right'}
                        disabled={!formatting.canAlign}
                        onClick={() => perform(() => onAlignment('right'))}
                    />
                </div>
            </fieldset>

            <fieldset className="mt-3">
                <legend className="px-1 text-xs font-medium text-muted-foreground">
                    Text direction
                </legend>
                <div className="mt-1 grid grid-cols-3 gap-1">
                    {(['auto', 'ltr', 'rtl'] as const).map((direction) => (
                        <ChoiceButton
                            key={direction}
                            label={
                                direction === 'auto'
                                    ? 'Auto'
                                    : direction.toUpperCase()
                            }
                            title={`Set ${direction === 'auto' ? 'automatic' : direction.toUpperCase()} block direction`}
                            active={formatting.direction === direction}
                            onClick={() =>
                                perform(() => onDirection(direction))
                            }
                        />
                    ))}
                </div>
            </fieldset>

            <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border/70 pt-2">
                <ActionButton
                    icon={<ArrowUp size={15} />}
                    label="Move up"
                    disabled={!canMoveUp}
                    onClick={() => perform(() => onAction('up'))}
                />
                <ActionButton
                    icon={<ArrowDown size={15} />}
                    label="Move down"
                    disabled={!canMoveDown}
                    onClick={() => perform(() => onAction('down'))}
                />
                <ActionButton
                    icon={<Files size={15} />}
                    label="Duplicate"
                    onClick={() => perform(() => onAction('duplicate'))}
                />
                <ActionButton
                    icon={<Copy size={15} />}
                    label="Copy text"
                    onClick={() => perform(() => onAction('copy'))}
                />
            </div>
            <ActionButton
                icon={<Trash2 size={15} />}
                label="Delete block"
                destructive
                onClick={() => perform(() => onAction('delete'))}
            />
        </div>
    );
}

function ChoiceButton({
    label,
    title,
    icon,
    active,
    disabled = false,
    onClick,
}: {
    label: string;
    title: string;
    icon?: ReactNode;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center justify-center gap-1 rounded-md border px-1.5 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-foreground/40 bg-accent' : 'border-border/70'}`}
        >
            {icon}
            {label}
        </button>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
    disabled = false,
    destructive = false,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? 'mt-1 text-destructive' : ''}`}
        >
            {icon}
            {label}
        </button>
    );
}
