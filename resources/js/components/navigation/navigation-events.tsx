import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { Auth } from '@/types';
import { useNavigation } from './navigation-store';
import type { TreeNode } from './navigation-types';
import { SearchMaster } from './search-master';
import {
    activateTab,
    closeTab,
    locationKind,
    openLocation,
    recordPage,
    stepHistory,
} from './tab-navigation';

type NavigationPageProps = {
    auth: Auth;
    workspace?: { id: number; name: string };
    node?: { id: number; title: string; parent_id: number | null };
    currentNode?: TreeNode | null;
    database?: { id: number; title: string; parent_id: number | null };
    nodes?: TreeNode[];
};

export function NavigationEvents() {
    const page = usePage<NavigationPageProps>();
    const { auth, workspace, node, currentNode, database } = page.props;
    const workspaceId = workspace?.id;
    const [searchOpen, setSearchOpen] = useState(false);
    const [fetchedNodes, setFetchedNodes] = useState<TreeNode[]>([]);
    const pageNodes = page.props.nodes;
    const nodes = pageNodes ?? fetchedNodes;
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
        setFetchedNodes([]);
        if (!workspaceId || pageNodes !== undefined || !searchOpen) return;
        const controller = new AbortController();
        fetch(`/workspaces/${workspaceId}/tree`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => (response.ok ? response.json() : []))
            .then((loadedNodes: TreeNode[]) => {
                if (!controller.signal.aborted) setFetchedNodes(loadedNodes);
            })
            .catch(() => {
                if (!controller.signal.aborted) setFetchedNodes([]);
            });
        return () => controller.abort();
    }, [workspaceId, page.version, page.props, pageNodes, searchOpen]);

    useEffect(() => {
        const openSearch = () => setSearchOpen(true);
        window.addEventListener('orbium:open-search', openSearch);
        return () =>
            window.removeEventListener('orbium:open-search', openSearch);
    }, []);

    useEffect(() => {
        function handleKeyboard(event: KeyboardEvent) {
            if (event.ctrlKey && event.code === 'Space' && workspaceId) {
                event.preventDefault();
                setSearchOpen((value) => !value);
            }
            if (
                event.altKey &&
                !(
                    event.target instanceof Element &&
                    event.target.closest('.floating-item')
                ) &&
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
        window.addEventListener('keydown', handleKeyboard, true);
        return () =>
            window.removeEventListener('keydown', handleKeyboard, true);
    }, [workspaceId]);

    useEffect(() => {
        function openModifiedLink(event: MouseEvent) {
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
            openLocation(anchor.pathname + anchor.search, true);
        }
        document.addEventListener('click', openModifiedLink, true);
        return () =>
            document.removeEventListener('click', openModifiedLink, true);
    }, []);

    if (!workspaceId) return null;

    return (
        <SearchMaster
            key={`search-${workspaceId}`}
            workspaceId={workspaceId}
            parent={parent}
            open={searchOpen}
            contextReady={
                !currentId || nodes.some((item) => item.id === currentId)
            }
            onClose={() => setSearchOpen(false)}
            onOpen={openLocation}
        />
    );
}
