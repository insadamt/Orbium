import { useEffect, type ReactNode } from 'react';
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
        <>
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
                if (
                    cached.page.component !== 'documents/show' ||
                    groupForTab(splitGroups, tabId)
                )
                    return null;
                const visible = tabId === visibleDocumentId;
                const active =
                    visible && destinationDocumentIsReady && tabId === activeId;
                return (
                    <div
                        key={`${tabId}:${cached.generation}`}
                        hidden={!visible}
                        inert={!active}
                        aria-busy={visible && !active}
                    >
                        <DocumentTabContext.Provider
                            value={{ tabId, active, url: cached.page.url }}
                        >
                            <DocumentSurface page={cached.page} />
                        </DocumentTabContext.Provider>
                    </div>
                );
            })}
        </>
    );
}
