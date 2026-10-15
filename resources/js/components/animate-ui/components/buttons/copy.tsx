'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckIcon, CopyIcon } from 'lucide-react';

import {
    Button as ButtonPrimitive,
    type ButtonProps as ButtonPrimitiveProps,
} from '@/components/animate-ui/primitives/buttons/button';
import { cn } from '@/lib/utils';
import { useControlledState } from '@/hooks/use-controlled-state';

const buttonVariants = cva(
    "flex shrink-0 items-center justify-center rounded-md transition-[box-shadow,_color,_background-color,_border-color,_outline-color,_text-decoration-color,_fill,_stroke] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
                accent: 'bg-accent text-accent-foreground shadow-xs hover:bg-accent/90',
                destructive:
                    'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
                outline:
                    'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'size-9',
                xs: "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
                sm: 'size-8 rounded-md',
                lg: 'size-10 rounded-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

type CopyButtonProps = Omit<ButtonPrimitiveProps, 'children' | 'content'> &
    VariantProps<typeof buttonVariants> & {
        content: string | (() => string);
        onCopyError?: (error: unknown) => void;
        copied?: boolean;
        onCopiedChange?: (copied: boolean, content?: string) => void;
        delay?: number;
    };

function CopyButton({
    className,
    content,
    copied,
    onCopiedChange,
    onClick,
    onCopyError,
    variant,
    size,
    delay = 3000,
    ...props
}: CopyButtonProps) {
    const [isCopied, setIsCopied] = useControlledState({
        value: copied,
        onChange: onCopiedChange,
    });

    const reducedMotion = useReducedMotion();
    const resetTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const mounted = React.useRef(false);
    React.useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            clearTimeout(resetTimer.current);
        };
    }, []);

    const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        try {
            const text = typeof content === 'function' ? content() : content;
            await navigator.clipboard.writeText(text);
            if (!mounted.current) return;
            setIsCopied(true, text);
            clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => setIsCopied(false), delay);
        } catch (error) {
            if (mounted.current) onCopyError?.(error);
        }
    };

    const Icon = isCopied ? CheckIcon : CopyIcon;

    return (
        <ButtonPrimitive
            data-slot="copy-button"
            className={cn(buttonVariants({ variant, size, className }))}
            onClick={handleCopy}
            hoverScale={reducedMotion ? 1 : 1.05}
            tapScale={reducedMotion ? 1 : 0.95}
            {...props}
        >
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={isCopied ? 'check' : 'copy'}
                    data-slot="copy-button-icon"
                    initial={
                        reducedMotion
                            ? false
                            : { scale: 0, opacity: 0.4, filter: 'blur(4px)' }
                    }
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    exit={
                        reducedMotion
                            ? undefined
                            : { scale: 0, opacity: 0.4, filter: 'blur(4px)' }
                    }
                    transition={{ duration: reducedMotion ? 0 : 0.25 }}
                >
                    <Icon aria-hidden="true" />
                </motion.span>
            </AnimatePresence>
        </ButtonPrimitive>
    );
}

export { CopyButton, buttonVariants, type CopyButtonProps };
