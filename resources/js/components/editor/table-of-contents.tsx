import { Pin, PinOff, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOutlinePanelHost } from './document-outline-layout';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import { attachOutlineRailFollowing } from './outline-rail-scrolling';

export type DocumentHeading = {
    position: number;
    level: 1 | 2;
    label: string;
};
export type DocumentOutline = {
    readHeadings: () => DocumentHeading[];
    readReadingPosition: () => number;
    subscribe: (refresh: () => void) => () => void;
    subscribeToScrolling: (refresh: () => void) => () => void;
    navigateToHeading: (heading: DocumentHeading) => () => void;
};

function focusAdjacentHeading(event: KeyboardEvent<HTMLElement>) {
    if (
        !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) ||
        !(event.target instanceof HTMLElement)
    )
        return;
    const current = event.target.closest<HTMLButtonElement>(
        '.document-outline-heading',
    );
    if (!current) return;
    const buttons = [
        ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '.document-outline-heading',
        ),
    ];
    const index = buttons.indexOf(current);
    const destination =
        event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : event.key === 'ArrowDown'
                ? Math.min(index + 1, buttons.length - 1)
                : Math.max(index - 1, 0);
    event.preventDefault();
    buttons[destination]?.focus();
}

export function TableOfContents({
    outline,
    openRequest = 0,
}: {
    outline: DocumentOutline | null;
    openRequest?: number;
}) {
    const { visible } = useDocumentTab();
    const { panelHost, title } = useOutlinePanelHost();
    const panelId = useId();
    const widget = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const navigation = useRef<(() => void) | null>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const [headings, setHeadings] = useState<DocumentHeading[]>([]);
    const [currentPosition, setCurrentPosition] = useState(-1);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    useEffect(() => {
        if (openRequest > 0) {
            setPinned(true);
            setDismissed(false);
        }
    }, [openRequest]);
    const expanded = visible && !dismissed && (pinned || hovered || focused);

    useEffect(
        () => () => {
            clearTimeout(leaveTimer.current);
            navigation.current?.();
        },
        [],
    );

    useEffect(() => {
        if (!visible) {
            clearTimeout(leaveTimer.current);
            navigation.current?.();
            setPinned(false);
            setHovered(false);
            setFocused(false);
            setDismissed(false);
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || !outline) return;
        let timer: ReturnType<typeof setTimeout>;
        const refresh = () => {
            setHeadings(outline.readHeadings());
            setCurrentPosition(outline.readReadingPosition());
        };
        refresh();
        const unsubscribe = outline.subscribe(() => {
            clearTimeout(timer);
            timer = setTimeout(refresh, 150);
        });
        const unsubscribeScrolling = outline.subscribeToScrolling(() =>
            setCurrentPosition(outline.readReadingPosition()),
        );
        return () => {
            clearTimeout(timer);
            unsubscribe();
            unsubscribeScrolling();
        };
    }, [visible, outline]);

    useEffect(() => {
        if (!expanded || pinned) return;
        const dismissOutside = (event: PointerEvent) => {
            if (
                event.target instanceof Node &&
                !widget.current?.contains(event.target)
            ) {
                setPinned(false);
                setHovered(false);
                setDismissed(true);
            }
        };
        document.addEventListener('pointerdown', dismissOutside);
        return () =>
            document.removeEventListener('pointerdown', dismissOutside);
    }, [expanded, pinned]);

    const currentHeading = headings.findLast(
        (heading) => heading.position <= currentPosition,
    );
    useEffect(() => {
        if (!visible || !panelHost || !trigger.current) return;
        return attachOutlineRailFollowing(trigger.current);
    }, [visible, panelHost, headings, currentHeading?.position]);

    function closePanel(returnFocus = true) {
        clearTimeout(leaveTimer.current);
        setPinned(false);
        setHovered(false);
        setDismissed(true);
        if (returnFocus) trigger.current?.focus({ preventScroll: true });
    }

    function selectHeading(heading: DocumentHeading) {
        navigation.current?.();
        if (!pinned) closePanel(false);
        navigation.current = outline?.navigateToHeading(heading) ?? null;
    }

    if (!visible || !outline || !panelHost) return null;
    return createPortal(
        <div
            ref={widget}
            className="document-outline-widget"
            data-open={expanded}
            onPointerEnter={(event) => {
                clearTimeout(leaveTimer.current);
                if (
                    event.pointerType !== 'touch' &&
                    window.matchMedia('(hover: hover)').matches
                ) {
                    setDismissed(false);
                    setHovered(true);
                }
            }}
            onPointerLeave={() => {
                clearTimeout(leaveTimer.current);
                leaveTimer.current = setTimeout(() => {
                    setHovered(false);
                }, 180);
            }}
            onFocusCapture={(event) => {
                setFocused(true);
                if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                )
                    setDismissed(false);
            }}
            onBlurCapture={(event) => {
                if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                )
                    setFocused(false);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    closePanel();
                } else focusAdjacentHeading(event);
            }}
        >
            <button
                ref={trigger}
                type="button"
                className="document-outline-rail"
                aria-label={
                    pinned
                        ? 'Collapse document outline'
                        : 'Open and pin document outline'
                }
                aria-expanded={expanded}
                aria-controls={expanded ? panelId : undefined}
                title="Document outline"
                onClick={() => {
                    if (pinned) closePanel();
                    else {
                        setPinned(true);
                        setDismissed(false);
                    }
                }}
            >
                {headings.length ? (
                    headings.map((heading) => (
                        <span
                            key={heading.position}
                            aria-hidden="true"
                            className="document-outline-rail-mark"
                            data-level={heading.level}
                            data-current={heading === currentHeading}
                        />
                    ))
                ) : (
                    <span
                        className="document-outline-empty-marks"
                        aria-hidden="true"
                    >
                        <i />
                        <i />
                        <i />
                    </span>
                )}
            </button>
            <nav
                id={panelId}
                aria-label={`Contents of ${title || 'this document'}`}
                className="document-outline-panel glass-surface"
                data-pinned={pinned}
                data-open={expanded}
                aria-hidden={!expanded}
                inert={!expanded}
            >
                <div className="document-outline-header">
                    <span
                        className="min-w-0 flex-1 truncate text-xs font-medium"
                        title={title}
                    >
                        {title || 'Contents'}
                    </span>
                    <button
                        type="button"
                        className="document-outline-close"
                        aria-label={
                            pinned
                                ? 'Unpin document outline'
                                : 'Pin document outline'
                        }
                        title={pinned ? 'Unpin' : 'Pin'}
                        aria-pressed={pinned}
                        onClick={() => {
                            setPinned((current) => !current);
                            setDismissed(false);
                        }}
                    >
                        {pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button
                        type="button"
                        className="document-outline-close"
                        aria-label="Close document outline"
                        title="Close"
                        onClick={() => closePanel()}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="document-outline-list-scroll">
                    {!headings.length ? (
                        <p className="px-3 py-4 text-xs leading-relaxed text-muted-foreground">
                            Add headings to navigate your document here.
                        </p>
                    ) : (
                        <ol>
                            {headings.map((heading) => (
                                <li key={heading.position}>
                                    <button
                                        type="button"
                                        className="document-outline-heading"
                                        data-level={heading.level}
                                        aria-current={
                                            heading === currentHeading
                                                ? 'location'
                                                : undefined
                                        }
                                        title={heading.label}
                                        onClick={() => selectHeading(heading)}
                                    >
                                        <span dir="auto">{heading.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </nav>
        </div>,
        panelHost,
    );
}
