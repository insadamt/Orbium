import * as Menu from '@/components/ui/dropdown-menu';
import { ChevronDown, Search } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AppSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
    searchKeywords?: string[];
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
    searchPlaceholder?: string;
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
    searchPlaceholder,
    disabled,
    id,
}: AppSelectProps) {
    const generatedId = useId();
    const clearValue = `${generatedId}-clear`;
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInput = useRef<HTMLInputElement>(null);
    const results = useRef<HTMLDivElement>(null);
    const searchTerms = searchQuery
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    const visibleOptions = searchPlaceholder
        ? options.filter((option) => {
              const searchableText = [
                  option.label,
                  option.value,
                  ...(option.searchKeywords ?? []),
              ]
                  .join(' ')
                  .toLowerCase();
              return searchTerms.every((term) => searchableText.includes(term));
          })
        : options;
    function selectValue(value: string) {
        onValueChange(value === clearValue ? '' : value);
        setOpen(false);
    }
    function focusResult(last = false) {
        const items = results.current?.querySelectorAll<HTMLElement>(
            '[role="menuitemradio"]:not([data-disabled])',
        );
        const item = last ? items?.[items.length - 1] : items?.[0];
        item?.focus();
        item?.scrollIntoView({ block: 'nearest' });
    }
    const selectedOption = options.find((option) => option.value === value);
    return (
        <Menu.Root
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                setSearchQuery('');
            }}
        >
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
                onKeyDown={(event) => {
                    if (
                        !searchPlaceholder ||
                        event.defaultPrevented ||
                        event.target === searchInput.current ||
                        event.ctrlKey ||
                        event.metaKey ||
                        event.altKey ||
                        event.nativeEvent.isComposing
                    )
                        return;
                    if (event.key.length === 1 || event.key === 'Backspace') {
                        event.preventDefault();
                        event.stopPropagation();
                        searchInput.current?.focus();
                        setSearchQuery((query) =>
                            event.key === 'Backspace'
                                ? query.slice(0, -1)
                                : query + event.key,
                        );
                    }
                }}
                className={cn(
                    'max-w-[min(26rem,calc(100vw-16px))] min-w-[var(--radix-dropdown-menu-trigger-width)]',
                    searchPlaceholder && 'overflow-hidden',
                    contentClassName,
                )}
            >
                {searchPlaceholder && (
                    <div className="mb-1 flex items-center gap-2 border-b border-border px-2 pt-1 pb-2">
                        <Search
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            ref={searchInput}
                            type="search"
                            value={searchQuery}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            aria-controls={`${generatedId}-options`}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') return;
                                event.stopPropagation();
                                if (event.nativeEvent.isComposing) return;
                                if (
                                    event.key === 'ArrowDown' ||
                                    event.key === 'ArrowUp'
                                ) {
                                    event.preventDefault();
                                    focusResult(event.key === 'ArrowUp');
                                } else if (event.key === 'Enter') {
                                    event.preventDefault();
                                    const first = visibleOptions.find(
                                        (option) => !option.disabled,
                                    );
                                    if (first) selectValue(first.value);
                                }
                            }}
                        />
                    </div>
                )}
                <Menu.RadioGroup
                    ref={results}
                    id={`${generatedId}-options`}
                    className={
                        searchPlaceholder ? 'overflow-y-auto' : undefined
                    }
                    style={
                        searchPlaceholder
                            ? {
                                  maxHeight:
                                      'min(20rem, max(4rem, calc(var(--radix-dropdown-menu-content-available-height) - 4rem)))',
                              }
                            : undefined
                    }
                    value={value || clearValue}
                    onValueChange={selectValue}
                    onKeyDown={(event) => {
                        if (!searchPlaceholder || event.key !== 'ArrowUp')
                            return;
                        const first = results.current?.querySelector(
                            '[role="menuitemradio"]:not([data-disabled])',
                        );
                        if (event.target === first) {
                            event.preventDefault();
                            event.stopPropagation();
                            searchInput.current?.focus();
                        }
                    }}
                >
                    {clearLabel && !searchQuery && (
                        <Menu.RadioItem value={clearValue}>
                            {clearLabel}
                        </Menu.RadioItem>
                    )}
                    {visibleOptions.map((option) => (
                        <Menu.RadioItem
                            key={option.value}
                            value={option.value || clearValue}
                            disabled={option.disabled}
                            textValue={option.label}
                        >
                            {option.icon ? (
                                <span className="flex min-w-0 items-center gap-2.5">
                                    <span
                                        className="flex size-6 shrink-0 items-center justify-center"
                                        aria-hidden="true"
                                    >
                                        {option.icon}
                                    </span>
                                    <span className="truncate">
                                        {option.label}
                                    </span>
                                </span>
                            ) : (
                                option.label
                            )}
                        </Menu.RadioItem>
                    ))}
                </Menu.RadioGroup>
                {searchPlaceholder && !visibleOptions.length && (
                    <p
                        role="status"
                        className="px-3 py-4 text-sm text-muted-foreground"
                    >
                        No matches found.
                    </p>
                )}
            </Menu.Content>
        </Menu.Root>
    );
}
