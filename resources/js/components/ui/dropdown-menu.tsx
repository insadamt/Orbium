import type { ComponentProps } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSubContent,
} from '@/components/animate-ui/components/radix/dropdown-menu';

export {
    DropdownMenu as Root,
    DropdownMenuTrigger as Trigger,
    DropdownMenuGroup as Group,
    DropdownMenuLabel as Label,
    DropdownMenuSeparator as Separator,
    DropdownMenuCheckboxItem as CheckboxItem,
    DropdownMenuRadioGroup as RadioGroup,
    DropdownMenuRadioItem as RadioItem,
    DropdownMenuSub as Sub,
    DropdownMenuSubTrigger as SubTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
export { DropdownMenuItemIndicator as ItemIndicator } from '@/components/animate-ui/primitives/radix/dropdown-menu';

export function Content({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuContent>) {
    const reducedMotion = useReducedMotion();
    return (
        <DropdownMenuContent
            data-app-menu-content
            className={cn('app-menu-content glass-surface', className)}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            {...props}
        />
    );
}

export function SubContent({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuSubContent>) {
    const reducedMotion = useReducedMotion();
    return (
        <DropdownMenuSubContent
            data-app-menu-content
            className={cn('app-menu-content glass-surface', className)}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            {...props}
        />
    );
}

export function Item(props: ComponentProps<typeof DropdownMenuItem>) {
    return <DropdownMenuItem {...props} />;
}
