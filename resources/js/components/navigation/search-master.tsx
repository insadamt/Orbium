import {
    FileText,
    Folder,
    Database,
    Search,
    CornerDownLeft,
    Command,
    ArrowUpRight,
    MoreHorizontal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { CreateNodeForm } from './create-node-form';
import { Dialog, DialogContent, DialogTitle } from './navigation-dialog';
import { useNavigation } from './navigation-store';
import type { SearchResult, TreeNode } from './navigation-types';
import { nodeUrl } from './navigation-types';

type Props = {
    workspaceId: number;
    contextReady: boolean;
    parent: TreeNode | null;
    open: boolean;
    onClose: () => void;
    onNavigator: (id?: number) => void;
    onOpen: (url: string, newTab?: boolean) => void;
    onReveal: (node: TreeNode) => void;
};

const resultIcons = { document: FileText, folder: Folder, database: Database };

export function SearchMaster({
    workspaceId,
    contextReady,
    parent,
    open,
    onClose,
    onNavigator,
    onOpen,
    onReveal,
}: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [selected, setSelected] = useState(0);
    const [status, setStatus] = useState('');
    const [createType, setCreateType] = useState<TreeNode['type'] | null>(null);
    const [actionsId, setActionsId] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const recent = useNavigation((state) => state.recent);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setCreateType(null);
            setActionsId(null);
            return;
        }
        requestAnimationFrame(() => inputRef.current?.focus());
    }, [open]);
    useEffect(() => {
        if (!open || query.startsWith('>')) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setStatus('Searching…');
            try {
                const params = new URLSearchParams({ q: query });
                if (parent) params.set('parent_id', String(parent.id));
                recent.forEach((id) => params.append('recent[]', String(id)));
                const response = await fetch(
                    `/workspaces/${workspaceId}/search?${params}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                if (!response.ok)
                    throw new Error('Search is unavailable. Try again.');
                const data = await response.json();
                setResults(data.results);
                setTags(data.tags);
                setStatus('');
            } catch (error) {
                if (!controller.signal.aborted) {
                    setResults([]);
                    setTags([]);
                    setStatus((error as Error).message);
                }
            }
        }, 150);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, open, workspaceId, parent, recent]);

    function beginCreate(type: TreeNode['type']) {
        if (!contextReady) {
            setStatus('The current location is still loading.');
            return;
        }
        setCreateType(type);
    }
    const commandItems = [
        { label: 'New document', action: () => beginCreate('document') },
        ...(parent?.type === 'database'
            ? []
            : [
                  { label: 'New folder', action: () => beginCreate('folder') },
                  {
                      label: 'New database',
                      action: () => beginCreate('database'),
                  },
              ]),
        {
            label: 'Workspace root',
            action: () => {
                onOpen(`/workspaces/${workspaceId}`);
                onClose();
            },
        },
        {
            label: 'Open Navigator',
            action: () => {
                onClose();
                onNavigator();
            },
        },
        {
            label: 'Open Settings',
            action: () => {
                onOpen('/settings/profile');
                onClose();
            },
        },
        {
            label: 'Toggle appearance',
            action: () => {
                updateAppearance(
                    resolvedAppearance === 'dark' ? 'light' : 'dark',
                );
                onClose();
            },
        },
    ];
    const term = query.startsWith('>')
        ? query.slice(1).trim().toLowerCase()
        : '';
    const commands =
        query.startsWith('>') || !query.trim()
            ? commandItems.filter((item) =>
                  item.label.toLowerCase().includes(term),
              )
            : [];
    const tagChoices = !query.startsWith('>') ? tags : [];
    const shownResults = query.startsWith('>') ? [] : results;
    const count = shownResults.length + tagChoices.length + commands.length;
    const activeIndex = Math.min(selected, Math.max(count - 1, 0));
    useEffect(() => {
        if (open && count)
            document
                .getElementById(`search-choice-${activeIndex}`)
                ?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, count, open]);

    function openResult(result: SearchResult, newTab = false) {
        const find = result.find
            ? `?find=${encodeURIComponent(result.find)}`
            : '';
        onOpen(nodeUrl(workspaceId, result) + find, newTab);
        onClose();
    }
    function activate(index: number, newTab = false) {
        if (index < shownResults.length) {
            openResult(shownResults[index], newTab);
            return;
        }
        const tag = tagChoices[index - shownResults.length];
        if (tag) {
            setQuery(`#${tag}`);
            setSelected(0);
            setTags([]);
            return;
        }
        commands[index - shownResults.length - tagChoices.length]?.action();
    }
    function changeQuery(value: string) {
        setQuery(value);
        setSelected(0);
        setResults([]);
        setTags([]);
        setActionsId(null);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) onClose();
            }}
        >
            <DialogContent className="glass-surface top-[12vh] gap-0 overflow-hidden p-0 sm:max-w-[680px]">
                <DialogTitle className="sr-only">Search Master</DialogTitle>
                <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
                    <Search
                        size={20}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        ref={inputRef}
                        role="combobox"
                        aria-label="Search workspace"
                        aria-expanded="true"
                        aria-controls="search-results"
                        aria-activedescendant={
                            count ? `search-choice-${activeIndex}` : undefined
                        }
                        value={query}
                        onChange={(event) => changeQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (
                                event.key === 'ArrowDown' ||
                                event.key === 'ArrowUp'
                            ) {
                                event.preventDefault();
                                setSelected(
                                    (activeIndex +
                                        (event.key === 'ArrowDown' ? 1 : -1) +
                                        count) %
                                        Math.max(count, 1),
                                );
                            }
                            if (event.key === 'Enter' && !createType) {
                                event.preventDefault();
                                activate(
                                    activeIndex,
                                    event.ctrlKey || event.metaKey,
                                );
                            }
                        }}
                        placeholder="Search anything…"
                        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    />
                    <kbd className="hidden rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground sm:block">
                        ESC
                    </kbd>
                </div>
                {createType ? (
                    <div className="p-5">
                        <CreateNodeForm
                            workspaceId={workspaceId}
                            parentId={parent?.id ?? null}
                            type={createType}
                            onCancel={() => {
                                setCreateType(null);
                                inputRef.current?.focus();
                            }}
                            onCreated={onClose}
                        />
                    </div>
                ) : (
                    <>
                        <div
                            id="search-results"
                            role="listbox"
                            className="max-h-[min(55vh,490px)] min-h-32 overflow-y-auto px-2 py-2"
                        >
                            {shownResults.map((result, index) => {
                                const Icon = resultIcons[result.type];
                                return (
                                    <div key={result.id}>
                                        {(index === 0 ||
                                            result.match !==
                                                shownResults[index - 1]
                                                    .match) && (
                                            <p className="px-4 pt-3 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                                {result.match}
                                            </p>
                                        )}
                                        <div
                                            id={`search-choice-${index}`}
                                            role="option"
                                            aria-selected={
                                                activeIndex === index
                                            }
                                            className={`group rounded-xl transition-colors ${activeIndex === index ? 'bg-accent' : 'hover:bg-accent/60'}`}
                                        >
                                            <div className="flex items-center gap-3 px-3 py-2.5">
                                                <Icon
                                                    size={18}
                                                    className="shrink-0 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <button
                                                    type="button"
                                                    onMouseEnter={() =>
                                                        setSelected(index)
                                                    }
                                                    onClick={(event) =>
                                                        openResult(
                                                            result,
                                                            event.ctrlKey ||
                                                                event.metaKey,
                                                        )
                                                    }
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <span className="block truncate text-sm font-medium">
                                                        {result.title}{' '}
                                                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                            {result.label}
                                                        </span>
                                                    </span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {result.path}
                                                    </span>
                                                    {result.snippet && (
                                                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                                                            {result.snippet}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`More actions for ${result.title}`}
                                                    onClick={() =>
                                                        setActionsId(
                                                            actionsId ===
                                                                result.id
                                                                ? null
                                                                : result.id,
                                                        )
                                                    }
                                                    className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                            {actionsId === result.id && (
                                                <div className="flex flex-wrap gap-1 border-t border-border/50 px-3 py-2 text-xs">
                                                    <button
                                                        className="rounded-md px-2 py-1.5 hover:bg-background"
                                                        onClick={() =>
                                                            openResult(
                                                                result,
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Open in new tab
                                                    </button>
                                                    <button
                                                        className="rounded-md px-2 py-1.5 hover:bg-background"
                                                        onClick={() => {
                                                            onClose();
                                                            onNavigator(
                                                                result.id,
                                                            );
                                                        }}
                                                    >
                                                        Reveal in Navigator
                                                    </button>
                                                    <button
                                                        className="rounded-md px-2 py-1.5 hover:bg-background"
                                                        onClick={() => {
                                                            onClose();
                                                            onReveal(result);
                                                        }}
                                                    >
                                                        Reveal in Orbit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {tagChoices.length > 0 && (
                                <p className="px-4 pt-4 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                    Tags
                                </p>
                            )}
                            {tagChoices.map((tag, index) => (
                                <button
                                    key={tag}
                                    id={`search-choice-${shownResults.length + index}`}
                                    role="option"
                                    aria-selected={
                                        activeIndex ===
                                        shownResults.length + index
                                    }
                                    onClick={() =>
                                        activate(shownResults.length + index)
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${activeIndex === shownResults.length + index ? 'bg-accent' : 'hover:bg-accent/60'}`}
                                >
                                    <span className="text-muted-foreground">
                                        #
                                    </span>
                                    {tag}
                                    <ArrowUpRight
                                        size={14}
                                        className="ml-auto text-muted-foreground"
                                    />
                                </button>
                            ))}
                            {commands.length > 0 && (
                                <p className="px-4 pt-4 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                    Commands
                                </p>
                            )}
                            {commands.map((command, index) => (
                                <button
                                    key={command.label}
                                    id={`search-choice-${shownResults.length + tagChoices.length + index}`}
                                    role="option"
                                    aria-selected={
                                        activeIndex ===
                                        shownResults.length +
                                            tagChoices.length +
                                            index
                                    }
                                    onMouseEnter={() =>
                                        setSelected(
                                            shownResults.length +
                                                tagChoices.length +
                                                index,
                                        )
                                    }
                                    onClick={command.action}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${activeIndex === shownResults.length + tagChoices.length + index ? 'bg-accent' : 'hover:bg-accent/60'}`}
                                >
                                    <Command
                                        size={16}
                                        className="text-muted-foreground"
                                    />
                                    {command.label}
                                </button>
                            ))}
                            {!count && !status && (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    {query
                                        ? `No results for “${query}”`
                                        : 'Open a document to see it here.'}
                                </div>
                            )}
                            {status && (
                                <p
                                    role="status"
                                    className="px-4 py-3 text-sm text-muted-foreground"
                                >
                                    {status}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <CornerDownLeft size={13} /> Open{' '}
                                <span className="mx-1">·</span> ↑ ↓ Navigate{' '}
                                <span className="mx-1">·</span> Ctrl + Enter New
                                tab
                            </span>
                            <span>
                                Type{' '}
                                <kbd className="rounded border px-1.5 py-0.5">
                                    &gt;
                                </kbd>{' '}
                                for commands
                            </span>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
