import type { ContentOwnerKind } from '@/components/editor/editor-api';
import * as Dialog from '@radix-ui/react-dialog';
import { usePage } from '@inertiajs/react';
import { useId, useMemo, useRef, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import {
    IconPickerNavigation,
    type BrowseScope,
    type IconSource,
} from './icon-picker-navigation';
import {
    iconCatalog,
    iconChoiceKey,
    matchesIconSearch,
    normalizeIconSearch,
    type InlineIconChoice,
} from './icon-catalog';
import { InlineIconGlyph } from './inline-icon-glyph';
import { IconResultsGrid, type IconGridHandle } from './icon-results-grid';
import { CustomIconBrowser } from './custom-icon-browser';
import {
    readIconPreferences,
    rememberIconChoice,
    saveIconPreferences,
} from './icon-preferences';
import './inline-icons.css';

type IconPickerProps = {
    workspaceId: number;
    nodeId: number;
    initialQuery?: string;
    busy?: boolean;
    error?: string;
    ownerKind?: ContentOwnerKind;
    portalContainer?: HTMLElement;
    preferenceScope?: string;
    onChoose: (choice: InlineIconChoice) => void;
    onUpload: () => void;
    onClose: () => void;
    onReturnFocus: () => void;
};
export function InlineIconPicker(props: IconPickerProps) {
    return props.preferenceScope ? (
        <IconPickerContent {...props} preferenceKey={props.preferenceScope} />
    ) : (
        <AuthenticatedIconPicker {...props} />
    );
}
function AuthenticatedIconPicker(props: IconPickerProps) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    return (
        <IconPickerContent
            {...props}
            preferenceKey={`orbium:inline-icons:v1:${auth.user.id}:${props.workspaceId}`}
        />
    );
}
function IconPickerContent({
    workspaceId,
    nodeId,
    initialQuery = '',
    busy = false,
    error = '',
    onChoose,
    onUpload,
    onClose,
    onReturnFocus,
    ownerKind,
    portalContainer,
    preferenceKey,
}: IconPickerProps & { preferenceKey: string }) {
    const [preferences, setPreferences] = useState(() =>
        readIconPreferences(preferenceKey),
    );
    const [source, setSource] = useState<IconSource>(() =>
        initialQuery
            ? (iconCatalog.find((icon) =>
                  matchesIconSearch(icon.search, initialQuery),
              )?.family ?? 'emoji')
            : 'emoji',
    );
    const [scope, setScope] = useState<BrowseScope>('catalog');
    const [category, setCategory] = useState('All');
    const [tone, setTone] = useState('0');
    const [query, setQuery] = useState(initialQuery);
    const [preview, setPreview] = useState<InlineIconChoice | null>(null);
    const search = useRef<HTMLInputElement>(null);
    const grid = useRef<IconGridHandle>(null);
    const id = useId();
    const groups = useMemo(
        () => [
            ...new Set(
                iconCatalog
                    .filter((icon) => icon.family === source)
                    .map((icon) => icon.group),
            ),
        ],
        [source],
    );
    const choices = useMemo(() => {
        if (scope !== 'catalog')
            return preferences[
                scope === 'recent' ? 'recent' : 'favorites'
            ].filter((choice) =>
                matchesIconSearch(normalizeIconSearch(choice.label), query),
            );
        return iconCatalog
            .filter(
                (icon) =>
                    icon.family === source &&
                    (category === 'All' || icon.group === category) &&
                    matchesIconSearch(icon.search, query) &&
                    (source !== 'emoji' ||
                        tone === 'all' ||
                        /skin|tone/i.test(query) ||
                        (tone === '0'
                            ? icon.tones.length === 0
                            : icon.tones.includes(Number(tone)))),
            )
            .map((icon) => icon.choice);
    }, [source, scope, preferences, query, category, tone]);
    const current = preview ?? choices[0];
    const favorite = Boolean(
        current &&
        preferences.favorites.some(
            (choice) => iconChoiceKey(choice) === iconChoiceKey(current),
        ),
    );
    const custom = source === 'custom' && scope === 'catalog';
    const caption =
        scope === 'recent'
            ? 'Recently used'
            : scope === 'favorites'
              ? 'Saved favorites'
              : category === 'All'
                ? source === 'emoji'
                    ? 'All emoji'
                    : source === 'brands'
                      ? 'Brand icons'
                      : 'All icons'
                : category;

    function choose(choice: InlineIconChoice) {
        if (busy) return;
        saveIconPreferences(
            preferenceKey,
            rememberIconChoice(readIconPreferences(preferenceKey), choice),
        );
        onChoose(choice);
    }
    function switchSource(next: IconSource) {
        if (busy) return;
        setSource(next);
        setScope('catalog');
        setCategory('All');
        setPreview(null);
    }
    function switchScope(next: BrowseScope) {
        setScope(scope === next ? 'catalog' : next);
        setPreview(null);
    }
    function toggleFavorite() {
        if (!current || busy) return;
        const latest = readIconPreferences(preferenceKey);
        const key = iconChoiceKey(current);
        const saved = latest.favorites.some(
            (item) => iconChoiceKey(item) === key,
        );
        const favorites = saved
            ? latest.favorites.filter((item) => iconChoiceKey(item) !== key)
            : [...latest.favorites, current].slice(-100);
        const next = { ...latest, favorites };
        setPreferences(next);
        saveIconPreferences(preferenceKey, next);
    }

    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <Dialog.Portal container={portalContainer}>
                <Dialog.Overlay className="inline-icon-overlay" />
                <Dialog.Content
                    className="inline-icon-picker"
                    data-inline-icon-picker
                    onKeyDown={(event) => {
                        if (event.ctrlKey || event.metaKey)
                            event.stopPropagation();
                    }}
                    aria-busy={busy}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        search.current?.focus();
                    }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        onReturnFocus();
                    }}
                    onEscapeKeyDown={(event) => {
                        if (busy) event.preventDefault();
                    }}
                    onPointerDownOutside={(event) => {
                        if (busy) event.preventDefault();
                    }}
                >
                    <header className="icon-picker-header">
                        <div>
                            <Dialog.Title>Emoji & icons</Dialog.Title>
                            <Dialog.Description>
                                Find a symbol for your words
                            </Dialog.Description>
                        </div>
                        <Dialog.Close
                            className="icon-picker-close"
                            aria-label="Close icon picker"
                            disabled={busy}
                        >
                            <X size={17} />
                        </Dialog.Close>
                    </header>
                    <div className="icon-picker-search">
                        <Search size={17} aria-hidden="true" />
                        <input
                            ref={search}
                            type="search"
                            value={query}
                            disabled={busy}
                            placeholder={
                                custom
                                    ? 'Search your images…'
                                    : 'Search by name…'
                            }
                            aria-label="Search emoji and icons"
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setCategory('All');
                                setPreview(null);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowDown') {
                                    event.preventDefault();
                                    grid.current?.focusFirst();
                                }
                                if (
                                    event.key === 'Enter' &&
                                    !custom &&
                                    choices[0] &&
                                    !event.nativeEvent.isComposing
                                ) {
                                    event.preventDefault();
                                    choose(choices[0]);
                                }
                            }}
                        />
                        {query && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                disabled={busy}
                                onClick={() => {
                                    setQuery('');
                                    setPreview(null);
                                    search.current?.focus();
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <IconPickerNavigation
                        id={id}
                        source={source}
                        scope={scope}
                        category={category}
                        tone={tone}
                        groups={groups}
                        disabled={busy}
                        onSource={switchSource}
                        onScope={switchScope}
                        onCategory={(next) => {
                            setCategory(next);
                            setPreview(null);
                        }}
                        onTone={(next) => {
                            setTone(next);
                            setPreview(null);
                        }}
                    />
                    <div
                        id={`${id}-panel`}
                        role="tabpanel"
                        aria-labelledby={`${id}-${source}`}
                        className="icon-picker-panel"
                    >
                        {busy && (
                            <p role="status" className="icon-picker-message">
                                Uploading icon…
                            </p>
                        )}
                        {error && (
                            <p
                                role="alert"
                                className="icon-picker-message is-error"
                            >
                                {error}
                            </p>
                        )}
                        {custom ? (
                            <CustomIconBrowser
                                workspaceId={workspaceId}
                                nodeId={nodeId}
                                ownerKind={ownerKind}
                                query={query}
                                disabled={busy}
                                onChoose={choose}
                                onPreview={setPreview}
                                onUpload={onUpload}
                                gridRef={grid}
                            />
                        ) : (
                            <>
                                <div className="icon-results-heading">
                                    <span>
                                        {query ? 'Search results' : caption}
                                    </span>
                                    <span aria-live="polite">
                                        {choices.length.toLocaleString()}
                                    </span>
                                </div>
                                {choices.length ? (
                                    <IconResultsGrid
                                        key={`${source}:${scope}:${category}:${tone}:${query}`}
                                        choices={choices}
                                        workspaceId={workspaceId}
                                        nodeId={nodeId}
                                        ownerKind={ownerKind}
                                        disabled={busy}
                                        onChoose={choose}
                                        onPreview={setPreview}
                                        gridRef={grid}
                                    />
                                ) : (
                                    <div className="icon-picker-empty">
                                        <Search size={25} />
                                        <strong>
                                            {query
                                                ? 'Nothing found yet'
                                                : scope === 'favorites'
                                                  ? 'Keep your favorites here'
                                                  : 'Your next favorite awaits'}
                                        </strong>
                                        <span>
                                            {query
                                                ? 'Try another name or browse a different source.'
                                                : scope === 'favorites'
                                                  ? 'Hover an icon, then use the star below to save it.'
                                                  : 'Icons you use appear in Recent.'}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <footer className="icon-picker-footer">
                        <div className="icon-picker-preview">
                            {current ? (
                                <>
                                    <InlineIconGlyph
                                        choice={current}
                                        workspaceId={workspaceId}
                                        nodeId={nodeId}
                                        ownerKind={ownerKind}
                                    />
                                    <span>
                                        <strong>{current.label}</strong>
                                        <small>
                                            {current.kind === 'emoji'
                                                ? 'Emoji'
                                                : current.kind === 'custom'
                                                  ? 'Your image'
                                                  : current.name.startsWith(
                                                          'brand-',
                                                      )
                                                    ? 'Brand icon'
                                                    : 'Lucide icon'}
                                        </small>
                                    </span>
                                </>
                            ) : (
                                <span className="icon-picker-hint">
                                    Choose an icon to insert
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="icon-save-favorite"
                            disabled={!current || busy}
                            aria-pressed={favorite}
                            aria-label={
                                current
                                    ? `${favorite ? 'Remove' : 'Save'} ${current.label} ${favorite ? 'from' : 'to'} favorites`
                                    : 'Save favorite'
                            }
                            title={
                                favorite ? 'Remove favorite' : 'Save favorite'
                            }
                            onClick={toggleFavorite}
                        >
                            <Star
                                size={18}
                                fill={favorite ? 'currentColor' : 'none'}
                            />
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
