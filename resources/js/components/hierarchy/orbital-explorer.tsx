import { router } from '@inertiajs/react';
import gsap from 'gsap';
import { Database, FileText, Folder, Plus, X } from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent,
    type WheelEvent,
} from 'react';
import { toast } from 'sonner';
import { CreateNodeForm } from '@/components/navigation/create-node-form';
import { NodeActions } from '@/components/navigation/node-actions';
import { nodeUrl } from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { HierarchyNode, TrashedNode } from './node-browser';
import OrbitalTrash from './orbital-trash';
import OrbitalPath from './orbital-path';
import OrbitalWorkspaceCarousel from './orbital-workspace-carousel';
import OrbitalExplorerHeader from './orbital-explorer-header';
import type { WorkspaceSummary } from './workspace-panel';

type Props = {
    workspace: WorkspaceSummary;
    workspaces: WorkspaceSummary[];
    nodes: HierarchyNode[];
    trashedNodes: TrashedNode[];
    currentNode: HierarchyNode | null;
    onManageWorkspaces: () => void;
};

const nodeIcons = { folder: Folder, document: FileText, database: Database };

function wrapIndex(index: number, count: number) {
    return (index + count) % count;
}

export default function OrbitalExplorer({
    workspace,
    workspaces,
    nodes,
    trashedNodes,
    currentNode,
    onManageWorkspaces,
}: Props) {
    const [exploring, setExploring] = useState(
        () =>
            Boolean(currentNode) ||
            (typeof window !== 'undefined' &&
                new URLSearchParams(window.location.search).has('explore')),
    );
    const [workspaceIndex, setWorkspaceIndex] = useState(() =>
        Math.max(
            0,
            workspaces.findIndex((item) => item.id === workspace.id),
        ),
    );
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [createType, setCreateType] = useState<HierarchyNode['type'] | null>(
        null,
    );
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [trashOpen, setTrashOpen] = useState(false);
    const [actionsId, setActionsId] = useState<number | null>(null);
    const [localTags, setLocalTags] = useState<Record<number, string[]>>({});
    const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
    const stageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef<{ x: number; y: number } | null>(null);
    const dragged = useRef(false);
    const lastWheelChange = useRef(0);
    const currentWorkspace =
        workspaces[wrapIndex(workspaceIndex, workspaces.length)] ?? workspace;
    const children = useMemo(
        () =>
            nodes.filter(
                (node) => node.parent_id === (currentNode?.id ?? null),
            ),
        [nodes, currentNode?.id],
    );
    const selectedNode = nodes.find((node) => node.id === actionsId);
    const allowedTypes: HierarchyNode['type'][] =
        currentNode?.type === 'database'
            ? ['document']
            : ['document', 'folder', 'database'];
    const radius = Math.min(
        stageSize.height * 0.39,
        stageSize.width * 0.39,
        360,
    );

    useEffect(() => {
        setFocusedIndex(0);
        setWorkspaceIndex(
            Math.max(
                0,
                workspaces.findIndex((item) => item.id === workspace.id),
            ),
        );
    }, [currentNode?.id, workspace.id, workspaces]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const observer = new ResizeObserver(([entry]) =>
            setStageSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            }),
        );
        observer.observe(stage);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const context = gsap.context(() => {
            if (reduceMotion) return;
            if (!exploring) {
                gsap.fromTo(
                    '.orbital-workspace-orb--0',
                    { scale: 0.75, opacity: 0 },
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 0.85,
                        ease: 'power3.out',
                    },
                );
                return;
            }
            gsap.timeline()
                .fromTo(
                    '.orbital-main-orb',
                    { x: stage.clientWidth / 2, scale: 0.78, opacity: 0.85 },
                    {
                        x: 0,
                        scale: 1,
                        opacity: 1,
                        duration: 1.05,
                        ease: 'power3.inOut',
                    },
                )
                .fromTo(
                    '.orbital-orbit-line',
                    { opacity: 0 },
                    { opacity: 1, duration: 0.7 },
                    0.3,
                )
                .fromTo(
                    '.orbital-child',
                    { opacity: 0, scale: 0.55 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.65,
                        stagger: 0.06,
                        ease: 'back.out(1.35)',
                    },
                    0.45,
                );
        }, stage);
        return () => context.revert();
    }, [exploring, currentNode?.id, workspace.id]);

    function changeFocus(direction: number) {
        if (exploring) {
            if (children.length)
                setFocusedIndex((index) =>
                    wrapIndex(index + direction, children.length),
                );
        } else if (workspaces.length) {
            setWorkspaceIndex((index) => index + direction);
        }
    }

    function enterWorkspace() {
        if (currentWorkspace.id !== workspace.id) {
            openLocation(`/workspaces/${currentWorkspace.id}?explore=1`);
            return;
        }
        setExploring(true);
    }

    function openNode(node: HierarchyNode) {
        if (dragged.current) return;
        if (node.type === 'folder')
            openLocation(`${nodeUrl(workspace.id, node)}?explore=1`);
        else openLocation(nodeUrl(workspace.id, node));
    }

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) return;
        if (
            event.target instanceof Element &&
            event.target.closest('.orbital-panel, .orbital-create-menu')
        )
            return;
        dragStart.current = { x: event.clientX, y: event.clientY };
        dragged.current = false;
    }

    function onPointerUp(event: PointerEvent<HTMLDivElement>) {
        if (!dragStart.current) return;
        const distance = exploring
            ? event.clientY - dragStart.current.y
            : event.clientX - dragStart.current.x;
        if (Math.abs(distance) > 38) {
            dragged.current = true;
            changeFocus(distance > 0 ? -1 : 1);
            window.setTimeout(() => {
                dragged.current = false;
            }, 80);
        }
        dragStart.current = null;
    }

    function onWheel(event: WheelEvent<HTMLDivElement>) {
        if (
            event.target instanceof Element &&
            event.target.closest('.orbital-panel, .orbital-create-menu')
        )
            return;
        const distance = exploring
            ? event.deltaY
            : Math.abs(event.deltaX) > Math.abs(event.deltaY)
              ? event.deltaX
              : event.deltaY;
        if (Math.abs(distance) < 14) return;
        event.preventDefault();
        if (Date.now() - lastWheelChange.current < 240) return;
        lastWheelChange.current = Date.now();
        changeFocus(distance > 0 ? 1 : -1);
    }

    function move(nodeId: number, parentId: number | null, position: number) {
        router.patch(
            `/workspaces/${workspace.id}/nodes/${nodeId}/move`,
            { parent_id: parentId, position },
            { onError: (errors) => toast.error(Object.values(errors)[0]) },
        );
    }

    const visibleChildren = children
        .map((node, index) => {
            const rawOffset = index - focusedIndex;
            const offset =
                rawOffset > children.length / 2
                    ? rawOffset - children.length
                    : rawOffset < -children.length / 2
                      ? rawOffset + children.length
                      : rawOffset;
            return { node, offset };
        })
        .filter(({ offset }) => Math.abs(offset) <= 3);

    return (
        <div
            className="orbital-explorer"
            ref={stageRef}
            tabIndex={0}
            aria-label="Workspace explorer"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
                dragStart.current = null;
            }}
            onWheel={onWheel}
            onKeyDown={(event) => {
                const isCarouselTarget =
                    event.target instanceof Element &&
                    event.target.closest('.orbital-workspace-field');
                if (event.target !== event.currentTarget && !isCarouselTarget)
                    return;
                if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
                    event.preventDefault();
                    changeFocus(1);
                }
                if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
                    event.preventDefault();
                    changeFocus(-1);
                }
                if (
                    event.key === 'Enter' &&
                    event.target === event.currentTarget
                ) {
                    event.preventDefault();
                    if (exploring && children.length)
                        openNode(children[focusedIndex]);
                    else enterWorkspace();
                }
                if (event.key === 'Escape') {
                    setExploring(false);
                    setActionsId(null);
                }
            }}
        >
            <div className="orbital-ambient" aria-hidden="true" />
            <div className="orbital-stars" aria-hidden="true" />
            <OrbitalExplorerHeader
                workspaceId={workspace.id}
                currentNode={currentNode}
                onShowWorkspaces={() => setExploring(false)}
                onManageWorkspaces={onManageWorkspaces}
            />
            <div className="orbital-heading">
                <p className="orbital-eyebrow">
                    {exploring ? 'Inside your space' : 'Your universe'}
                </p>
                <h1>
                    {exploring
                        ? (currentNode?.title ?? workspace.name)
                        : 'Choose a workspace'}
                </h1>
                <p>
                    {exploring
                        ? `${children.length} ${children.length === 1 ? 'object' : 'objects'} in orbit`
                        : 'Swipe through your spaces. Enter one to explore.'}
                </p>
            </div>
            {!exploring ? (
                <OrbitalWorkspaceCarousel
                    workspaces={workspaces}
                    selectedIndex={workspaceIndex}
                    stageWidth={stageSize.width}
                    onSelect={setWorkspaceIndex}
                    onEnter={enterWorkspace}
                    wasDragged={() => dragged.current}
                />
            ) : (
                <div className="orbital-contents">
                    <div
                        className="orbital-orbit-line"
                        style={{ width: radius * 2, height: radius * 2 }}
                        aria-hidden="true"
                    />
                    <button
                        type="button"
                        className="orbital-main-orb"
                        aria-label={`Return from ${currentNode?.title ?? workspace.name} to workspaces`}
                        onClick={() =>
                            currentNode
                                ? openLocation(
                                      `/workspaces/${workspace.id}?explore=1`,
                                  )
                                : setExploring(false)
                        }
                    >
                        <span>{currentNode?.title ?? workspace.name}</span>
                    </button>
                    {visibleChildren.map(({ node, offset }) => {
                        const angle = (offset * 25 * Math.PI) / 180;
                        const Icon = nodeIcons[node.type];
                        const isFocused = offset === 0;
                        return (
                            <button
                                key={node.id}
                                type="button"
                                className={`orbital-child ${isFocused ? 'orbital-child--focused' : ''}`}
                                style={{
                                    left: radius * Math.cos(angle),
                                    top: `calc(52% + ${radius * Math.sin(angle)}px)`,
                                }}
                                aria-label={`${node.title}, ${node.type}${isFocused ? ', focused' : ''}`}
                                onClick={() =>
                                    isFocused
                                        ? openNode(node)
                                        : setFocusedIndex(
                                              children.indexOf(node),
                                          )
                                }
                                onContextMenu={(event) => {
                                    event.preventDefault();
                                    setActionsId(node.id);
                                }}
                            >
                                <span className="orbital-child-label">
                                    {node.title}
                                </span>
                                <span className="orbital-child-icon">
                                    <Icon
                                        size={isFocused ? 25 : 21}
                                        strokeWidth={1.6}
                                    />
                                </span>
                            </button>
                        );
                    })}
                    {children.length === 0 && (
                        <div className="orbital-empty">
                            <p>Nothing in this orbit yet.</p>
                            <button
                                type="button"
                                onClick={() => setCreateType('document')}
                            >
                                Create a document
                            </button>
                        </div>
                    )}
                    {children.length > 1 && (
                        <p className="orbital-gesture-hint orbital-gesture-hint--vertical">
                            ↑ SWIPE TO ORBIT ↓
                        </p>
                    )}
                </div>
            )}
            {exploring && (
                <OrbitalPath
                    workspace={workspace}
                    currentNode={currentNode}
                    nodes={nodes}
                />
            )}
            {exploring && (
                <div className="orbital-create">
                    <button
                        type="button"
                        aria-label="Create item"
                        aria-expanded={createMenuOpen}
                        onClick={() => setCreateMenuOpen(!createMenuOpen)}
                    >
                        <Plus size={22} />
                    </button>
                    {createMenuOpen && (
                        <div className="orbital-create-menu">
                            {allowedTypes.map((type) => (
                                <button
                                    type="button"
                                    key={type}
                                    onClick={() => {
                                        setCreateType(type);
                                        setCreateMenuOpen(false);
                                    }}
                                >
                                    New {type}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setTrashOpen(true);
                                    setCreateMenuOpen(false);
                                }}
                            >
                                Trash
                            </button>
                        </div>
                    )}
                </div>
            )}
            {createType && (
                <div className="orbital-panel-backdrop">
                    <div className="orbital-panel">
                        <button
                            type="button"
                            className="orbital-panel-close"
                            aria-label="Close"
                            onClick={() => setCreateType(null)}
                        >
                            <X size={18} />
                        </button>
                        <CreateNodeForm
                            workspaceId={workspace.id}
                            parentId={currentNode?.id ?? null}
                            type={createType}
                            onCancel={() => setCreateType(null)}
                            onCreated={() => setCreateType(null)}
                        />
                    </div>
                </div>
            )}
            {selectedNode && (
                <div className="orbital-panel-backdrop">
                    <div className="orbital-panel">
                        <button
                            type="button"
                            className="orbital-panel-close"
                            aria-label="Close"
                            onClick={() => setActionsId(null)}
                        >
                            <X size={18} />
                        </button>
                        <NodeActions
                            workspaceId={workspace.id}
                            node={{
                                ...selectedNode,
                                tags:
                                    localTags[selectedNode.id] ??
                                    selectedNode.tags,
                            }}
                            nodes={nodes}
                            onClose={() => setActionsId(null)}
                            onDismiss={() => setActionsId(null)}
                            onTagsSaved={(id, tags) =>
                                setLocalTags((previous) => ({
                                    ...previous,
                                    [id]: tags,
                                }))
                            }
                            onOpen={openLocation}
                            onMove={move}
                        />
                    </div>
                </div>
            )}
            {trashOpen && (
                <OrbitalTrash
                    workspaceId={workspace.id}
                    nodes={trashedNodes}
                    onClose={() => setTrashOpen(false)}
                />
            )}
        </div>
    );
}
