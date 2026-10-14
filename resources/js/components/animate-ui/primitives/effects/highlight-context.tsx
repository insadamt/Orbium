import * as React from 'react';
import type { Transition } from 'motion/react';

export type HighlightMode = 'children' | 'parent';

type Bounds = {
    top: number;
    left: number;
    width: number;
    height: number;
};

const DEFAULT_BOUNDS_OFFSET: Bounds = {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
};

type HighlightContextType<T extends string> = {
    as?: keyof HTMLElementTagNameMap;
    mode: HighlightMode;
    activeValue: T | null;
    setActiveValue: (value: T | null) => void;
    setBounds: (bounds: DOMRect) => void;
    clearBounds: () => void;
    id: string;
    hover: boolean;
    click: boolean;
    className?: string;
    style?: React.CSSProperties;
    activeClassName?: string;
    setActiveClassName: (className: string) => void;
    transition?: Transition;
    disabled?: boolean;
    enabled?: boolean;
    exitDelay?: number;
    forceUpdateBounds?: boolean;
};

const HighlightContext = React.createContext<
    HighlightContextType<any> | undefined
>(undefined);

function useHighlight<T extends string>(): HighlightContextType<T> {
    const context = React.useContext(HighlightContext);
    if (!context) {
        throw new Error('useHighlight must be used within a HighlightProvider');
    }
    return context as unknown as HighlightContextType<T>;
}

export { HighlightContext, useHighlight, DEFAULT_BOUNDS_OFFSET, type Bounds };
