'use client';

import * as React from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';

import { cn } from '@/lib/utils';

import {
    HighlightContext,
    DEFAULT_BOUNDS_OFFSET,
    type Bounds,
    type HighlightMode,
} from './highlight-context';
import { HighlightItem } from './highlight-item';

type BaseHighlightProps<T extends React.ElementType = 'div'> = {
    as?: T;
    ref?: React.Ref<HTMLDivElement>;
    mode?: HighlightMode;
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    className?: string;
    style?: React.CSSProperties;
    transition?: Transition;
    hover?: boolean;
    click?: boolean;
    disabled?: boolean;
    enabled?: boolean;
    exitDelay?: number;
};

type ParentModeHighlightProps = {
    boundsOffset?: Partial<Bounds>;
    containerClassName?: string;
    forceUpdateBounds?: boolean;
};

type ControlledParentModeHighlightProps<T extends React.ElementType = 'div'> =
    BaseHighlightProps<T> &
        ParentModeHighlightProps & {
            mode: 'parent';
            controlledItems: true;
            children: React.ReactNode;
        };

type ControlledChildrenModeHighlightProps<T extends React.ElementType = 'div'> =
    BaseHighlightProps<T> & {
        mode?: 'children' | undefined;
        controlledItems: true;
        children: React.ReactNode;
    };

type UncontrolledParentModeHighlightProps<T extends React.ElementType = 'div'> =
    BaseHighlightProps<T> &
        ParentModeHighlightProps & {
            mode: 'parent';
            controlledItems?: false;
            itemsClassName?: string;
            children: React.ReactElement | React.ReactElement[];
        };

type UncontrolledChildrenModeHighlightProps<
    T extends React.ElementType = 'div',
> = BaseHighlightProps<T> & {
    mode?: 'children';
    controlledItems?: false;
    itemsClassName?: string;
    children: React.ReactElement | React.ReactElement[];
};

type HighlightProps<T extends React.ElementType = 'div'> =
    | ControlledParentModeHighlightProps<T>
    | ControlledChildrenModeHighlightProps<T>
    | UncontrolledParentModeHighlightProps<T>
    | UncontrolledChildrenModeHighlightProps<T>;

function Highlight<T extends React.ElementType = 'div'>({
    ref,
    ...props
}: HighlightProps<T>) {
    const {
        as: Component = 'div',
        children,
        value,
        defaultValue,
        onValueChange,
        className,
        style,
        transition = { type: 'spring', stiffness: 350, damping: 35 },
        hover = false,
        click = true,
        enabled = true,
        controlledItems,
        disabled = false,
        exitDelay = 200,
        mode = 'children',
    } = props;

    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const propsBoundsOffset = (props as ParentModeHighlightProps)?.boundsOffset;
    const boundsOffset = propsBoundsOffset ?? DEFAULT_BOUNDS_OFFSET;
    const boundsOffsetTop = boundsOffset.top ?? 0;
    const boundsOffsetLeft = boundsOffset.left ?? 0;
    const boundsOffsetWidth = boundsOffset.width ?? 0;
    const boundsOffsetHeight = boundsOffset.height ?? 0;

    const boundsOffsetRef = React.useRef({
        top: boundsOffsetTop,
        left: boundsOffsetLeft,
        width: boundsOffsetWidth,
        height: boundsOffsetHeight,
    });

    React.useEffect(() => {
        boundsOffsetRef.current = {
            top: boundsOffsetTop,
            left: boundsOffsetLeft,
            width: boundsOffsetWidth,
            height: boundsOffsetHeight,
        };
    }, [
        boundsOffsetTop,
        boundsOffsetLeft,
        boundsOffsetWidth,
        boundsOffsetHeight,
    ]);

    const [activeValue, setActiveValue] = React.useState<string | null>(
        value ?? defaultValue ?? null,
    );
    const [boundsState, setBoundsState] = React.useState<Bounds | null>(null);
    const [activeClassNameState, setActiveClassNameState] =
        React.useState<string>('');

    const safeSetActiveValue = (id: string | null) => {
        setActiveValue((prev) => {
            if (prev !== id) {
                onValueChange?.(id);
                return id;
            }
            return prev;
        });
    };

    const safeSetBoundsRef = React.useRef<
        ((bounds: DOMRect) => void) | undefined
    >(undefined);

    React.useEffect(() => {
        safeSetBoundsRef.current = (bounds: DOMRect) => {
            if (!localRef.current) return;

            const containerRect = localRef.current.getBoundingClientRect();
            const offset = boundsOffsetRef.current;
            const newBounds: Bounds = {
                top: bounds.top - containerRect.top + offset.top,
                left: bounds.left - containerRect.left + offset.left,
                width: bounds.width + offset.width,
                height: bounds.height + offset.height,
            };

            setBoundsState((prev) => {
                if (
                    prev &&
                    prev.top === newBounds.top &&
                    prev.left === newBounds.left &&
                    prev.width === newBounds.width &&
                    prev.height === newBounds.height
                ) {
                    return prev;
                }
                return newBounds;
            });
        };
    });

    const safeSetBounds = (bounds: DOMRect) => {
        safeSetBoundsRef.current?.(bounds);
    };

    const clearBounds = React.useCallback(() => {
        setBoundsState((prev) => (prev === null ? prev : null));
    }, []);

    React.useEffect(() => {
        if (value !== undefined) setActiveValue(value);
        else if (defaultValue !== undefined) setActiveValue(defaultValue);
    }, [value, defaultValue]);

    const id = React.useId();

    React.useEffect(() => {
        if (mode !== 'parent') return;
        const container = localRef.current;
        if (!container) return;

        const onScroll = () => {
            if (!activeValue) return;
            const activeEl = container.querySelector<HTMLElement>(
                `[data-value="${activeValue}"][data-highlight="true"]`,
            );
            if (activeEl)
                safeSetBoundsRef.current?.(activeEl.getBoundingClientRect());
        };

        container.addEventListener('scroll', onScroll, { passive: true });
        return () => container.removeEventListener('scroll', onScroll);
    }, [mode, activeValue]);

    const render = (children: React.ReactNode) => {
        if (mode === 'parent') {
            return (
                <Component
                    ref={localRef}
                    data-slot="motion-highlight-container"
                    style={{ position: 'relative', zIndex: 1 }}
                    className={
                        (props as ParentModeHighlightProps)?.containerClassName
                    }
                >
                    <AnimatePresence initial={false} mode="wait">
                        {boundsState && (
                            <motion.div
                                data-slot="motion-highlight"
                                animate={{
                                    top: boundsState.top,
                                    left: boundsState.left,
                                    width: boundsState.width,
                                    height: boundsState.height,
                                    opacity: 1,
                                }}
                                initial={{
                                    top: boundsState.top,
                                    left: boundsState.left,
                                    width: boundsState.width,
                                    height: boundsState.height,
                                    opacity: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    transition: {
                                        ...transition,
                                        delay:
                                            (transition?.delay ?? 0) +
                                            (exitDelay ?? 0) / 1000,
                                    },
                                }}
                                transition={transition}
                                style={{
                                    position: 'absolute',
                                    zIndex: 0,
                                    ...style,
                                }}
                                className={cn(className, activeClassNameState)}
                            />
                        )}
                    </AnimatePresence>
                    {children}
                </Component>
            );
        }

        return children;
    };

    return (
        <HighlightContext.Provider
            value={{
                mode,
                activeValue,
                setActiveValue: safeSetActiveValue,
                id,
                hover,
                click,
                className,
                style,
                transition,
                disabled,
                enabled,
                exitDelay,
                setBounds: safeSetBounds,
                clearBounds,
                activeClassName: activeClassNameState,
                setActiveClassName: setActiveClassNameState,
                forceUpdateBounds: (props as ParentModeHighlightProps)
                    ?.forceUpdateBounds,
            }}
        >
            {enabled
                ? controlledItems
                    ? render(children)
                    : render(
                          React.Children.map(children, (child, index) => (
                              <HighlightItem
                                  key={index}
                                  className={props?.itemsClassName}
                              >
                                  {child}
                              </HighlightItem>
                          )),
                      )
                : children}
        </HighlightContext.Provider>
    );
}

export { Highlight, type HighlightProps };
export { HighlightItem, type HighlightItemProps } from './highlight-item';
export { useHighlight } from './highlight-context';
