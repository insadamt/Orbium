import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export type AppSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type AppSelectProps = {
    value: string;
    onValueChange: (value: string) => void;
    options: AppSelectOption[];
    placeholder?: string;
    clearLabel?: string;
    label: string;
    className?: string;
    contentClassName?: string;
    disabled?: boolean;
    id?: string;
};

export function AppSelect({
    value,
    onValueChange,
    options,
    placeholder,
    clearLabel,
    label,
    className,
    contentClassName,
    disabled,
    id,
}: AppSelectProps) {
    const generatedId = useId();
    const clearValue = `${generatedId}-clear`;

    return (
        <Select.Root
            value={value}
            onValueChange={(nextValue) =>
                onValueChange(nextValue === clearValue ? '' : nextValue)
            }
            disabled={disabled}
        >
            <Select.Trigger
                id={id ?? generatedId}
                aria-label={label}
                className={cn(
                    'flex min-h-9 min-w-0 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground shadow-sm outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground',
                    className,
                )}
            >
                <Select.Value placeholder={placeholder ?? label} />
                <Select.Icon className="shrink-0 text-muted-foreground">
                    <ChevronDown size={15} aria-hidden="true" />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content
                    position="popper"
                    sideOffset={5}
                    collisionPadding={8}
                    className={cn(
                        'z-[100] min-w-[var(--radix-select-trigger-width)] max-w-[min(26rem,calc(100vw-16px))] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl',
                        contentClassName,
                    )}
                >
                    <Select.ScrollUpButton className="flex h-6 items-center justify-center text-muted-foreground">
                        <ChevronUp size={14} />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))]">
                        {clearLabel && (
                            <Select.Item
                                value={clearValue}
                                className="flex min-h-9 cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none data-[highlighted]:bg-accent"
                            >
                                <Select.ItemText>{clearLabel}</Select.ItemText>
                            </Select.Item>
                        )}
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                className="relative flex min-h-9 cursor-pointer items-center rounded-lg py-2 pr-8 pl-3 text-sm outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                            >
                                <Select.ItemText>{option.label}</Select.ItemText>
                                <Select.ItemIndicator className="absolute right-2 text-foreground">
                                    <Check size={15} aria-hidden="true" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex h-6 items-center justify-center text-muted-foreground">
                        <ChevronDown size={14} />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}
