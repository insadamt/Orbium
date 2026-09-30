import { router, usePage } from '@inertiajs/react';
import { ListTree, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavigationTabMenu } from './navigation-tab-menu';
import type { Auth } from '@/types';
import { Navigator } from './navigator';
import { useNavigation } from './navigation-store';
import type { TreeNode } from './navigation-types';
import { SearchMaster } from './search-master';
import {
    locationKind,
    recordPage,
    openLocation as open,
    activateTab,
    stepHistory,
    closeTab,
} from './tab-navigation';

type Props = {
    auth: Auth;
    workspace?: { id: number; name: string };
    node?: { id: number; title: string; parent_id: number | null };
    currentNode?: TreeNode | null;
    database?: { id: number; title: string; parent_id: number | null };
};
export function WorkspaceNavigation() {
    const page = usePage<Props>();
    const { auth, workspace, node, currentNode, database } = page.props;
    const workspaceId = workspace?.id;
    const [searchOpen, setSearchOpen] = useState(false);
    const [navigatorOpen, setNavigatorOpen] = useState(false);
    const [revealId, setRevealId] = useState<number>();
    const [nodes, setNodes] = useState<TreeNode[]>([]);
    const [treeError, setTreeError] = useState('');
    const currentId = node?.id ?? database?.id ?? currentNode?.id;
    const title =
        node?.title ??
        database?.title ??
        currentNode?.title ??
        workspace?.name ??
        (page.url.startsWith('/settings') ? 'Settings' : 'Home');
    const parent =
        locationKind(page.url) === 'document'
            ? (nodes.find((item) => item.id === node?.parent_id) ?? null)
            : (nodes.find((item) => item.id === currentId) ?? null);

    useEffect(() => {
        const firstLoad = !useNavigation.getState().storageKey;
        useNavigation.getState().initialize(auth.user.id);
        recordPage(page);
        if (firstLoad) {
            const navigation = useNavigation.getState();
            const tab = navigation.tabs.find(
                (item) => item.id === navigation.activeId,
            );
            requestAnimationFrame(() =>
                window.scrollTo(0, tab?.entries[tab.index].scroll ?? 0),
            );
        }
    }, [auth.user.id, page.url, title, currentId, page]);
    useEffect(() => {
        const saveScroll = () => useNavigation.getState().saveScroll();
        const removeStart = router.on('before', saveScroll);
        window.addEventListener('pagehide', saveScroll);
        return () => {
            removeStart();
            window.removeEventListener('pagehide', saveScroll);
        };
    }, []);
    useEffect(() => {
        if (!workspaceId) {
            setNodes([]);
            return;
        }
        const controller = new AbortController();
        setNodes([]);
        setTreeError('');
        fetch(`/workspaces/${workspaceId}/tree`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        'Navigator could not load. Reload to retry.',
                    );
                return response.json();
            })
            .then(setNodes)
            .catch((error) => {
                if (!controller.signal.aborted) setTreeError(error.message);
            });
        return () => controller.abort();
    }, [workspaceId, page.version, page.props]);

    useEffect(() => {
        function keyboard(event: KeyboardEvent) {
            if (event.ctrlKey && event.code === 'Space' && workspaceId) {
                event.preventDefault();
                setSearchOpen((value) => !value);
                setNavigatorOpen(false);
            }
            if (
                event.ctrlKey &&
                event.key.toLowerCase() === 'b' &&
                workspaceId
            ) {
                event.preventDefault();
                event.stopPropagation();
                setNavigatorOpen((value) => !value);
                setSearchOpen(false);
            }
            if (
                event.altKey &&
                ['ArrowLeft', 'ArrowRight'].includes(event.key)
            ) {
                event.preventDefault();
                stepHistory(event.key === 'ArrowLeft' ? -1 : 1);
            }
            if (event.ctrlKey && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                closeTab(useNavigation.getState().activeId);
            }
            if (event.ctrlKey && event.key === 'Tab') {
                event.preventDefault();
                const navigation = useNavigation.getState();
                const index = navigation.tabs.findIndex(
                    (tab) => tab.id === navigation.activeId,
                );
                const next =
                    navigation.tabs[
                        (index +
                            (event.shiftKey ? -1 : 1) +
                            navigation.tabs.length) %
                            navigation.tabs.length
                    ];
                if (next) activateTab(next.id);
            }
        }
        window.addEventListener('keydown', keyboard, true);
        return () => window.removeEventListener('keydown', keyboard, true);
    }, [workspaceId, stepHistory, closeTab, activateTab]);
    useEffect(() => {
        function modifiedLink(event: MouseEvent) {
            if (!event.ctrlKey && !event.metaKey) return;
            const anchor = (event.target as HTMLElement).closest('a');
            if (
                !anchor ||
                anchor.origin !== window.location.origin ||
                !/^\/(workspaces\/\d+|settings\/)/.test(anchor.pathname)
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            open(anchor.pathname + anchor.search, true);
        }
        document.addEventListener('click', modifiedLink, true);
        return () => document.removeEventListener('click', modifiedLink, true);
    }, [open]);
    return (
        <>
            <div
                className="flex shrink-0 items-center gap-1 sm:gap-1.5"
                aria-label="Workspace controls"
            >
                <NavigationTabMenu
                    onRevealInNavigator={
                        currentId
                            ? () => {
                                  setRevealId(currentId);
                                  setNavigatorOpen(true);
                              }
                            : undefined
                    }
                />
                <button
                    type="button"
                    disabled={!workspaceId}
                    title="Search Master (Ctrl + Space)"
                    aria-label="Open Search Master"
                    onClick={() => setSearchOpen(true)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                >
                    <Search size={18} />
                </button>
                <button
                    type="button"
                    title="New workspace tab"
                    aria-label="New workspace tab"
                    onClick={() =>
                        open(
                            workspaceId
                                ? `/workspaces/${workspaceId}`
                                : '/dashboard',
                            true,
                        )
                    }
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Plus size={18} />
                </button>
                <button
                    type="button"
                    disabled={!workspaceId}
                    title="Navigator (Ctrl + B)"
                    aria-label="Open Navigator"
                    onClick={() => setNavigatorOpen(true)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                >
                    <ListTree size={18} />
                </button>
            </div>
            {workspaceId && (
                <>
                    <SearchMaster
                        key={`search-${workspaceId}`}
                        workspaceId={workspaceId}
                        parent={parent}
                        open={searchOpen}
                        contextReady={
                            !currentId ||
                            nodes.some((item) => item.id === currentId)
                        }
                        onClose={() => setSearchOpen(false)}
                        onNavigator={(id) => {
                            setRevealId(id);
                            setNavigatorOpen(true);
                        }}
                        onOpen={open}
                    />
                    <Navigator
                        key={`navigator-${workspaceId}`}
                        workspaceId={workspaceId}
                        nodes={nodes}
                        error={treeError}
                        open={navigatorOpen}
                        revealId={revealId}
                        onClose={() => setNavigatorOpen(false)}
                        onOpen={open}
                    />
                </>
            )}
        </>
    );
}
