import {
    memo,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import type { Page } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import {
    DocumentPage,
    type DocumentPageProps,
} from '@/components/documents/document-page';
import { DocumentTabContext } from './document-tab-context';
import { useNavigation } from './navigation-store';
import { useTabPageCache } from './tab-page-cache';
import { groupForTab } from './split-group-state';
import { SplitWorkspace } from './split-workspace';
import { useSplitPaneScroll } from './use-split-pane-scroll';
import { attachWorkspaceWheelScrolling } from './split-pane-scroll';
import {
    disposeSplitMotion,
    playPendingSplitMotion,
} from './split-workspace-motion';

function DocumentSurface({
    page,
    previewOnly = false,
}: {
    page: Page;
    previewOnly?: boolean;
}) {
    const props = page.props as unknown as DocumentPageProps;
    return (
        <DocumentPage
            workspace={props.workspace}
            node={props.node}
            savedDocument={props.document}
            databaseProperties={props.databaseProperties}
            databaseValues={props.databaseValues}
            mentionCandidates={props.mentionCandidates}
            databaseFiles={props.databaseFiles}
            previewOnly={previewOnly}
        />
    );
}

const RetainedDocumentTab = memo(function RetainedDocumentTab({
    tabId,
    page,
    visible,
    active,
    side,
}: {
    tabId: string;
    page: Page;
    visible: boolean;
    active: boolean;
    side?: 'left' | 'right';
}) {
    const paneRef = useSplitPaneScroll({
        tabId,
        split: Boolean(side),
        visible,
    });
    function activatePane() {
        if (side && !active)
            flushSync(() => useNavigation.getState().activate(tabId));
    }

    const documentTab = useMemo(
        () => ({ tabId, active, visible, url: page.url }),
        [tabId, active, visible, page.url],
    );
    return (
        <div
            ref={paneRef}
            hidden={!visible}
            inert={!visible || (!side && !active)}
            aria-busy={visible && !side && !active}
            className={
                side
                    ? `split-pane split-pane-position split-pane-position-${side}`
                    : undefined
            }
            data-workspace-tab-id={tabId}
            data-split-pane-id={side ? tabId : undefined}
            tabIndex={side ? -1 : undefined}
            onPointerDownCapture={activatePane}
            onFocusCapture={activatePane}
        >
            <DocumentTabContext.Provider value={documentTab}>
                <DocumentSurface page={page} />
            </DocumentTabContext.Provider>
        </div>
    );
});

export function RetainedDocumentWorkspace({
    children,
}: {
    children: ReactNode;
}) {
    const currentPage = usePage();
    const pages = useTabPageCache((state) => state.pages);
    const activeId = useNavigation((state) => state.activeId);
    const tabs = useNavigation((state) => state.tabs);
    const splitGroups = useNavigation((state) => state.splitGroups);
    const activeGroup = groupForTab(splitGroups, activeId);
    const workspaceRef = useRef<HTMLDivElement>(null);
    const activeTab = tabs.find((tab) => tab.id === activeId);
    const activeCached = pages[activeId];
    const destinationDocumentIsReady =
        activeCached?.page.component === 'documents/show' &&
        activeCached.page.url === activeTab?.entries[activeTab.index].url;
    const outgoingDocumentId = Object.entries(pages).find(
        ([tabId, cached]) =>
            cached.page.component === 'documents/show' &&
            cached.page.url === currentPage.url &&
            cached.page.props.document === currentPage.props.document &&
            !groupForTab(splitGroups, tabId),
    )?.[0];
    const visibleDocumentId = activeGroup
        ? undefined
        : destinationDocumentIsReady
          ? activeId
          : outgoingDocumentId;

    useLayoutEffect(() => {
        const workspace = workspaceRef.current;
        if (!activeGroup || !workspace) return;
        window.scrollTo(0, 0);
        let previousOffset = 0;
        const updateWorkspaceOffset = () => {
            const top =
                workspace.getBoundingClientRect().top +
                window.scrollY +
                previousOffset;
            previousOffset = top;
            workspace.style.setProperty('--split-workspace-offset', `${top}px`);
        };
        updateWorkspaceOffset();
        const detachWheel = attachWorkspaceWheelScrolling(workspace);
        const observer = new ResizeObserver(updateWorkspaceOffset);
        observer.observe(workspace);
        window.addEventListener('resize', updateWorkspaceOffset);
        return () => {
            observer.disconnect();
            detachWheel();
            window.removeEventListener('resize', updateWorkspaceOffset);
            workspace.style.removeProperty('--split-workspace-offset');
        };
    }, [activeGroup]);

    useLayoutEffect(() => {
        playPendingSplitMotion();
    }, [splitGroups]);

    useEffect(() => disposeSplitMotion, []);

    useEffect(() => {
        // Keep the outgoing surface until its replacement exists, then tear it down after paint.
        let timer: number | undefined;
        const frame = requestAnimationFrame(() => {
            timer = window.setTimeout(
                () =>
                    useTabPageCache
                        .getState()
                        .releaseClosedPages(visibleDocumentId),
                0,
            );
        });
        return () => {
            cancelAnimationFrame(frame);
            if (timer !== undefined) clearTimeout(timer);
        };
    }, [tabs, visibleDocumentId]);

    return (
        <div
            ref={workspaceRef}
            className={activeGroup ? 'split-workspace is-active' : undefined}
        >
            {!activeGroup &&
                !visibleDocumentId &&
                (currentPage.component === 'documents/show' ? (
                    <div inert aria-busy="true">
                        <DocumentSurface page={currentPage} previewOnly />
                    </div>
                ) : (
                    children
                ))}
            {Object.entries(pages).map(([tabId, cached]) => {
                if (cached.page.component !== 'documents/show') return null;
                const group = groupForTab(splitGroups, tabId);
                const tab = tabs.find((tab) => tab.id === tabId);
                const isSplitPane = Boolean(
                    group && cached.page.url === tab?.entries[tab.index].url,
                );
                const side = isSplitPane
                    ? group?.leftId === tabId
                        ? 'left'
                        : 'right'
                    : undefined;
                const visible =
                    (isSplitPane && group === activeGroup) ||
                    tabId === visibleDocumentId;
                const active =
                    visible && destinationDocumentIsReady && tabId === activeId;
                return (
                    <RetainedDocumentTab
                        key={`${tabId}:${cached.generation}`}
                        tabId={tabId}
                        page={cached.page}
                        visible={visible}
                        active={active}
                        side={side}
                    />
                );
            })}
            <SplitWorkspace>{null}</SplitWorkspace>
        </div>
    );
}
