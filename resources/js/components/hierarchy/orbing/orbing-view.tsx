import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigation } from '@/components/navigation/navigation-store';
import type { TreeNode } from '@/components/navigation/navigation-types';
import type { ExplorerMenuPosition } from '../explorer-context-menu';
import { projectWorldPoint, type OrbingLink } from './orbing-layout';
import {
    boundsForContainer,
    filterOrbingBranches,
    layoutOrbingSpace,
} from './orbing-space-layout';
import { OrbingEntityNode } from './orbing-entity';
import { OrbingCameraControls, OrbingSelection } from './orbing-controls';
import { useOrbingCamera } from './use-orbing-camera';
import { useOrbingMotion } from './use-orbing-motion';

type OrbingViewProps = {
    workspaceId: number;
    workspaceName: string;
    parentId: number | null;
    containerTitle: string;
    nodes: TreeNode[];
    mentionLinks: OrbingLink[];
    paused: boolean;
    query: string;
    initialSelectedId: number | null;
    onOpen: (node: TreeNode, newTab: boolean) => void;
    onActions: (nodeId: number | null, target: HTMLElement) => void;
    onContextMenu: (position: ExplorerMenuPosition) => void;
};

export function OrbingView(props: OrbingViewProps) {
    const activeId = useNavigation((state) => state.activeId);
    const accountKey = useNavigation((state) => state.storageKey);
    const tabId = window.name.startsWith('orbium-pane:')
        ? window.name.slice('orbium-pane:'.length)
        : activeId;
    if (!accountKey || !tabId) return null;
    const storageKey = `${accountKey}.orbing.constellation.v3.${tabId}.${props.workspaceId}.${props.parentId ?? 'root'}`;
    return <OrbingScene key={storageKey} {...props} storageKey={storageKey} />;
}

function OrbingScene({
    workspaceName,
    parentId,
    containerTitle,
    nodes,
    mentionLinks,
    paused,
    query,
    initialSelectedId,
    onOpen,
    onActions,
    onContextMenu,
    storageKey,
}: OrbingViewProps & { storageKey: string }) {
    const instructionsId = useId();
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [motionEnabled, setMotionEnabled] = useState(true);
    const [keyboardFocus, setKeyboardFocus] = useState(false);
    const connections = useMemo(() => {
        const unique = new Map<string, OrbingLink>();
        for (const link of mentionLinks) {
            const sourceId = Math.min(link.sourceId, link.targetId);
            const targetId = Math.max(link.sourceId, link.targetId);
            if (sourceId !== targetId)
                unique.set(`${sourceId}:${targetId}`, { sourceId, targetId });
        }
        return [...unique.values()];
    }, [mentionLinks]);
    const space = useMemo(() => layoutOrbingSpace(nodes), [nodes]);
    const bounds = useMemo(
        () => boundsForContainer(space, parentId),
        [space, parentId],
    );
    const visibleIds = useMemo(
        () => filterOrbingBranches(space, parentId, query),
        [space, parentId, query],
    );
    const camera = useOrbingCamera({
        storageKey,
        entities: space.entities,
        bounds,
        initialSelectedId,
    });
    const selected = space.entities.find(
        (entity) =>
            entity.node.id === camera.selectedId &&
            visibleIds.has(entity.node.id),
    );
    const motion = useOrbingMotion({
        storageKey,
        viewportRef: camera.viewportRef,
        entities: space.entities,
        mentionLinks: connections,
        enabled: motionEnabled,
        paused:
            paused ||
            hoveredId !== null ||
            keyboardFocus ||
            camera.dragging ||
            camera.selectedId !== null ||
            Boolean(query),
        camera: camera.camera,
        size: camera.size,
        visibleIds,
        selectedId: camera.selectedId,
        hoveredId,
        parentId,
    });
    const parentTitle =
        selected?.node.parent_id == null
            ? workspaceName
            : (nodes.find((node) => node.id === selected.node.parent_id)
                  ?.title ?? workspaceName);

    function focusSelected() {
        if (selected) camera.focusEntity(motion.currentPosition(selected));
    }
    function fitCurrentSystem() {
        const parent = space.entities.find(
            (entity) => entity.node.id === parentId,
        );
        camera.fitView(parent ? motion.currentPosition(parent) : undefined);
    }

    function navigateWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const target = event.target as HTMLElement;
        if (event.key === 'Escape') {
            event.preventDefault();
            camera.selectNode(null);
            event.currentTarget.focus({ preventScroll: true });
        }
        if (target.closest('[data-orbing-controls]')) return;
        if (
            event.key === 'F10' &&
            event.shiftKey &&
            target === event.currentTarget
        ) {
            event.preventDefault();
            onActions(null, event.currentTarget);
        }
        if (
            ![
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
                'Home',
                'End',
            ].includes(event.key)
        )
            return;
        if (
            target !== event.currentTarget &&
            !target.matches('[data-orbing-node]')
        )
            return;
        event.preventDefault();
        if (target === event.currentTarget) {
            if (event.key === 'Home') fitCurrentSystem();
            else
                camera.panBy(
                    event.key === 'ArrowLeft'
                        ? -80
                        : event.key === 'ArrowRight'
                          ? 80
                          : 0,
                    event.key === 'ArrowUp'
                        ? -80
                        : event.key === 'ArrowDown'
                          ? 80
                          : 0,
                );
            return;
        }
        const targets = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
                '.orbing-entity:not([hidden]) [data-orbing-node]',
            ),
        ];
        const index = targets.indexOf(target);
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? targets.length - 1
                  : (index +
                        (['ArrowLeft', 'ArrowUp'].includes(event.key)
                            ? -1
                            : 1) +
                        targets.length) %
                    targets.length;
        targets[next]?.focus({ preventScroll: true });
    }

    return (
        <div
            ref={camera.viewportRef}
            className="orbing-viewport"
            role="region"
            aria-label={`${workspaceName} space, exploring ${containerTitle}`}
            aria-describedby={instructionsId}
            tabIndex={0}
            data-dragging={camera.dragging}
            {...camera.pointerHandlers}
            onKeyDown={navigateWithKeyboard}
            onPointerOver={(event) => {
                const entity = (event.target as Element).closest<HTMLElement>(
                    '[data-node-id]',
                );
                setHoveredId(entity ? Number(entity.dataset.nodeId) : null);
            }}
            onPointerLeave={() => setHoveredId(null)}
            onFocusCapture={(event) =>
                setKeyboardFocus(event.target !== event.currentTarget)
            }
            onBlurCapture={(event) => {
                if (
                    !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                    )
                )
                    setKeyboardFocus(false);
            }}
            onContextMenu={(event) => {
                event.preventDefault();
                const target = event.target as HTMLElement;
                if (target.closest('[data-orbing-controls]')) return;
                const item = target.closest<HTMLElement>('[data-node-id]');
                const nodeId = item ? Number(item.dataset.nodeId) : null;
                if (nodeId) camera.selectNode(nodeId);
                onContextMenu({
                    nodeId,
                    x: event.clientX,
                    y: event.clientY,
                    direction: getComputedStyle(event.currentTarget)
                        .direction as 'ltr' | 'rtl',
                });
            }}
        >
            <svg
                className="orbing-tracks"
                width={camera.size.width}
                height={camera.size.height}
                aria-hidden="true"
            >
                {space.entities
                    .filter((entity) => entity.node.parent_id !== null)
                    .map((entity) => (
                        <circle
                            key={`orbit-${entity.node.id}`}
                            className="orbing-orbit-path"
                            data-orbing-orbit={entity.node.id}
                        />
                    ))}
                {connections.map((link) => (
                    <line
                        key={`${link.sourceId}:${link.targetId}`}
                        data-orbing-connection="true"
                        data-source-id={link.sourceId}
                        data-target-id={link.targetId}
                    />
                ))}
            </svg>
            {space.entities
                .filter((entity) => visibleIds.has(entity.node.id))
                .map((entity) => (
                    <OrbingEntityNode
                        key={entity.node.id}
                        entity={entity}
                        point={projectWorldPoint(
                            entity,
                            camera.camera,
                            camera.size,
                        )}
                        zoom={camera.camera.zoom}
                        selected={entity.node.id === camera.selectedId}
                        onSelect={() => camera.selectNode(entity.node.id)}
                        onOpen={(newTab) => onOpen(entity.node, newTab)}
                        onKeyboardFocus={() => {
                            camera.selectNode(entity.node.id);
                            camera.focusEntity(motion.currentPosition(entity));
                        }}
                        onActions={(target) =>
                            onActions(entity.node.id, target)
                        }
                    />
                ))}
            <OrbingCameraControls
                zoom={camera.camera.zoom}
                selected={Boolean(selected)}
                onZoom={camera.zoomBy}
                onFit={fitCurrentSystem}
                onFocus={focusSelected}
                motionEnabled={motionEnabled}
                reducedMotion={motion.reducedMotion}
                onToggleMotion={() => {
                    if (!motionEnabled) camera.selectNode(null);
                    setMotionEnabled((enabled) => !enabled);
                    camera.viewportRef.current?.focus({ preventScroll: true });
                }}
            />
            {selected && (
                <OrbingSelection
                    node={selected.node}
                    parentTitle={parentTitle}
                    onOpen={() => onOpen(selected.node, false)}
                    onClear={() => {
                        camera.selectNode(null);
                        camera.viewportRef.current?.focus({
                            preventScroll: true,
                        });
                    }}
                />
            )}
            <p id={instructionsId} className="orbing-instructions">
                Drag to explore · Scroll to zoom · Double-click to open
            </p>
            {space.entities.length === 0 && (
                <p className="orbing-empty">
                    Your space is empty. Right-click or press Shift+F10 to
                    create.
                </p>
            )}
            {query &&
                !space.entities.some(
                    (entity) =>
                        entity.node.parent_id === parentId &&
                        entity.node.title.toLocaleLowerCase().includes(query),
                ) && (
                    <p className="orbing-no-results" role="status">
                        No items match this search.
                    </p>
                )}
            <p className="sr-only" role="status">
                {selected
                    ? `${selected.node.title}, ${selected.node.type}, inside ${parentTitle}`
                    : ''}
            </p>
        </div>
    );
}
