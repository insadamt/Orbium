import * as React from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';
import { useHighlight, type Bounds } from './highlight-context';

function getNonOverridingDataAttributes(
    element: React.ReactElement,
    dataAttributes: Record<string, unknown>,
): Record<string, unknown> {
    return Object.keys(dataAttributes).reduce<Record<string, unknown>>(
        (acc, key) => {
            if ((element.props as Record<string, unknown>)[key] === undefined) {
                acc[key] = dataAttributes[key];
            }
            return acc;
        },
        {},
    );
}

type ExtendedChildProps = React.ComponentProps<'div'> & {
    id?: string;
    ref?: React.Ref<HTMLElement>;
    'data-active'?: string;
    'data-value'?: string;
    'data-disabled'?: boolean;
    'data-highlight'?: boolean;
    'data-slot'?: string;
};

type HighlightItemProps<T extends React.ElementType = 'div'> =
    React.ComponentProps<T> & {
        as?: T;
        children: React.ReactElement;
        id?: string;
        value?: string;
        className?: string;
        style?: React.CSSProperties;
        transition?: Transition;
        activeClassName?: string;
        disabled?: boolean;
        exitDelay?: number;
        asChild?: boolean;
        forceUpdateBounds?: boolean;
    };

function HighlightItem<T extends React.ElementType>({
    ref,
    as,
    children,
    id,
    value,
    className,
    style,
    transition,
    disabled = false,
    activeClassName,
    exitDelay,
    asChild = false,
    forceUpdateBounds,
    ...props
}: HighlightItemProps<T>) {
    const itemId = React.useId();
    const {
        activeValue,
        setActiveValue,
        mode,
        setBounds,
        clearBounds,
        hover,
        click,
        enabled,
        className: contextClassName,
        style: contextStyle,
        transition: contextTransition,
        id: contextId,
        disabled: contextDisabled,
        exitDelay: contextExitDelay,
        forceUpdateBounds: contextForceUpdateBounds,
        setActiveClassName,
    } = useHighlight();

    const Component = as ?? 'div';
    const element = children as React.ReactElement<ExtendedChildProps>;
    const childValue =
        id ??
        value ??
        element.props?.['data-value'] ??
        element.props?.id ??
        itemId;
    const isActive = activeValue === childValue;
    const isDisabled = disabled === undefined ? contextDisabled : disabled;
    const itemTransition = transition ?? contextTransition;

    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const refCallback = React.useCallback((node: HTMLElement | null) => {
        localRef.current = node as HTMLDivElement;
    }, []);

    React.useEffect(() => {
        if (mode !== 'parent') return;
        let rafId: number;
        let previousBounds: Bounds | null = null;
        const shouldUpdateBounds =
            forceUpdateBounds === true ||
            (contextForceUpdateBounds && forceUpdateBounds !== false);

        const updateBounds = () => {
            if (!localRef.current) return;

            const bounds = localRef.current.getBoundingClientRect();

            if (shouldUpdateBounds) {
                if (
                    previousBounds &&
                    previousBounds.top === bounds.top &&
                    previousBounds.left === bounds.left &&
                    previousBounds.width === bounds.width &&
                    previousBounds.height === bounds.height
                ) {
                    rafId = requestAnimationFrame(updateBounds);
                    return;
                }
                previousBounds = bounds;
                rafId = requestAnimationFrame(updateBounds);
            }

            setBounds(bounds);
        };

        if (isActive) {
            updateBounds();
            setActiveClassName(activeClassName ?? '');
        } else if (!activeValue) clearBounds();

        if (shouldUpdateBounds) return () => cancelAnimationFrame(rafId);
    }, [
        mode,
        isActive,
        activeValue,
        setBounds,
        clearBounds,
        activeClassName,
        setActiveClassName,
        forceUpdateBounds,
        contextForceUpdateBounds,
    ]);

    if (!React.isValidElement(children)) return children;

    const dataAttributes = {
        'data-active': isActive ? 'true' : 'false',
        'aria-selected': isActive,
        'data-disabled': isDisabled || undefined,
        'data-value': childValue,
        'data-highlight': true,
    };

    const commonHandlers = hover
        ? {
              onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
                  setActiveValue(childValue);
                  element.props.onMouseEnter?.(e);
              },
              onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
                  setActiveValue(null);
                  element.props.onMouseLeave?.(e);
              },
          }
        : click
          ? {
                onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                    setActiveValue(childValue);
                    element.props.onClick?.(e);
                },
            }
          : {};

    if (asChild) {
        if (mode === 'children') {
            return React.cloneElement(
                element,
                {
                    key: childValue,
                    ref: refCallback,
                    className: cn('relative', element.props.className),
                    ...getNonOverridingDataAttributes(element, {
                        ...dataAttributes,
                        'data-slot': 'motion-highlight-item-container',
                    }),
                    ...commonHandlers,
                    ...props,
                },
                <>
                    <AnimatePresence initial={false} mode="wait">
                        {isActive && !isDisabled && (
                            <motion.div
                                layoutId={`transition-background-${contextId}`}
                                data-slot="motion-highlight"
                                style={{
                                    position: 'absolute',
                                    zIndex: 0,
                                    ...contextStyle,
                                    ...style,
                                }}
                                className={cn(
                                    contextClassName,
                                    activeClassName,
                                )}
                                transition={itemTransition}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                    opacity: 0,
                                    transition: {
                                        ...itemTransition,
                                        delay:
                                            (itemTransition?.delay ?? 0) +
                                            (exitDelay ??
                                                contextExitDelay ??
                                                0) /
                                                1000,
                                    },
                                }}
                                {...dataAttributes}
                            />
                        )}
                    </AnimatePresence>

                    <Component
                        data-slot="motion-highlight-item"
                        style={{ position: 'relative', zIndex: 1 }}
                        className={className}
                        {...dataAttributes}
                    >
                        {children}
                    </Component>
                </>,
            );
        }

        return React.cloneElement(element, {
            ref: refCallback,
            ...getNonOverridingDataAttributes(element, {
                ...dataAttributes,
                'data-slot': 'motion-highlight-item',
            }),
            ...commonHandlers,
        });
    }

    return enabled ? (
        <Component
            key={childValue}
            ref={localRef}
            data-slot="motion-highlight-item-container"
            className={cn(mode === 'children' && 'relative', className)}
            {...dataAttributes}
            {...props}
            {...commonHandlers}
        >
            {mode === 'children' && (
                <AnimatePresence initial={false} mode="wait">
                    {isActive && !isDisabled && (
                        <motion.div
                            layoutId={`transition-background-${contextId}`}
                            data-slot="motion-highlight"
                            style={{
                                position: 'absolute',
                                zIndex: 0,
                                ...contextStyle,
                                ...style,
                            }}
                            className={cn(contextClassName, activeClassName)}
                            transition={itemTransition}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                transition: {
                                    ...itemTransition,
                                    delay:
                                        (itemTransition?.delay ?? 0) +
                                        (exitDelay ?? contextExitDelay ?? 0) /
                                            1000,
                                },
                            }}
                            {...dataAttributes}
                        />
                    )}
                </AnimatePresence>
            )}

            {React.cloneElement(element, {
                style: { position: 'relative', zIndex: 1 },
                className: element.props.className,
                ...getNonOverridingDataAttributes(element, {
                    ...dataAttributes,
                    'data-slot': 'motion-highlight-item',
                }),
            })}
        </Component>
    ) : (
        children
    );
}

export { HighlightItem, type HighlightItemProps };
