import * as Menu from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
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
    const selectedOption = options.find((option) => option.value === value);
    return (
        <Menu.Root>
            <Menu.Trigger
                id={id ?? generatedId}
                aria-label={label}
                disabled={disabled}
                className={cn(
                    'flex min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                    !selectedOption && 'text-muted-foreground',
                    className,
                )}
            >
                <span className="truncate">
                    {selectedOption?.label ?? placeholder ?? label}
                </span>
                <ChevronDown
                    size={15}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                />
            </Menu.Trigger>
            <Menu.Content
                sideOffset={5}
                collisionPadding={8}
                className={cn(
                    'max-w-[min(26rem,calc(100vw-16px))] min-w-[var(--radix-dropdown-menu-trigger-width)]',
                    contentClassName,
                )}
            >
                <Menu.RadioGroup
                    value={value || clearValue}
                    onValueChange={(nextValue) =>
                        onValueChange(nextValue === clearValue ? '' : nextValue)
                    }
                >
                    {clearLabel && (
                        <Menu.RadioItem value={clearValue}>
                            {clearLabel}
                        </Menu.RadioItem>
                    )}
                    {options.map((option) => (
                        <Menu.RadioItem
                            key={option.value}
                            value={option.value || clearValue}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </Menu.RadioItem>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}
