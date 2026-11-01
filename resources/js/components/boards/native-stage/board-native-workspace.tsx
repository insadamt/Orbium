// Summary: Presents the isolated Phase-2 graphics scratch scene with shared drawing/shape controls and manual profiling actions; depends on the native Stage owner and low-frequency completed-action notifications.

import { useLayoutEffect, useRef, useState } from 'react';
import {
    Circle,
    Grid2X2,
    Hand,
    Maximize,
    Minus,
    MousePointer2,
    Plus,
    RotateCcw,
    Square,
    Triangle,
    Pencil,
    Undo2,
    Redo2,
} from 'lucide-react';
import { BoardToolButton } from '../board-tool-button';
import {
    createNativeBoardStage,
    type NativeBoardStage,
} from './board-native-stage';
import type { NativeBoardTool } from './board-native-interactions';
import { BoardNativeBaseline } from './board-native-baseline';
import './board-native-stage.css';
import { BoardDrawingControls } from '../board-drawing-controls';
import { isBoardDrawingTool, type BoardBrush } from '../board-drawing-data';
import type { BoardDrawingSmoothing } from '../board-drawing-smoothing';
import type { BoardObject } from '../board-types';
import { BoardNativeSelectionControls } from './board-native-selection-controls';

export default function BoardNativeWorkspace({
    baseline,
    referenceGraphics,
}: {
    baseline: boolean;
    referenceGraphics: BoardObject[];
}) {
    return baseline ? (
        <BoardNativeBaseline />
    ) : (
        <BoardNativeFoundation referenceGraphics={referenceGraphics} />
    );
}

function BoardNativeFoundation({
    referenceGraphics,
}: {
    referenceGraphics: BoardObject[];
}) {
    const hostRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLSpanElement>(null);
    const runtimeRef = useRef<NativeBoardStage | null>(null);
    const [tool, setTool] = useState<NativeBoardTool>('select');
    const [grid, setGrid] = useState(true);
    const [brush, setBrush] = useState<BoardBrush>({
        color: 'currentColor',
        width: 3,
    });
    const [smoothing, setSmoothing] = useState<BoardDrawingSmoothing>('light');
    const [eraserSize, setEraserSize] = useState(16);
    const [pathCount, setPathCount] = useState(0);
    const [historyState, setHistoryState] = useState(0);
    const [selected, setSelected] = useState<BoardObject | null>(null);
    const [drawingSettingsOpen, setDrawingSettingsOpen] = useState(true);
    const [snapshot, setSnapshot] = useState('');
    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        const host = hostRef.current;
        const zoomLabel = zoomRef.current;
        if (!host || !zoomLabel) return;
        let runtime: NativeBoardStage;
        try {
            runtime = createNativeBoardStage(host, zoomLabel, {
                onSelectionChange: setSelected,
                onPathCountChange: setPathCount,
                onToolChange: setTool,
                onHistoryChange: setHistoryState,
            });
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Native Stage unavailable.',
            );
            return;
        }
        runtimeRef.current = runtime;
        return () => {
            runtimeRef.current = null;
            runtime.dispose();
        };
    }, []);

    useLayoutEffect(() => {
        runtimeRef.current?.setDrawingSettings({
            brush,
            smoothing,
            eraserSize,
        });
    }, [brush, smoothing, eraserSize]);

    function chooseTool(next: NativeBoardTool) {
        if (next !== tool) runtimeRef.current?.setTool(next);
        if (isBoardDrawingTool(next)) setDrawingSettingsOpen(true);
        setTool(next);
        hostRef.current?.focus({ preventScroll: true });
    }

    return (
        <section
            className="board-workspace board-native-workspace"
            aria-label="Native Konva foundation preview"
        >
            <div className="board-stage">
                <div
                    ref={hostRef}
                    className="board-canvas board-native-canvas"
                    data-board-renderer="native-stage"
                    tabIndex={0}
                    role="region"
                    aria-label="Native Stage scratch canvas"
                    aria-describedby="board-native-help"
                />
                <p id="board-native-help" className="board-native-notice">
                    Phase 2 preview · Unsaved scratch scene · Existing Board
                    content is safe.
                </p>
                {error && (
                    <p role="alert" className="board-native-error">
                        {error} Select another renderer to return to your Board.
                    </p>
                )}
                <div
                    className="board-native-toolbar"
                    role="toolbar"
                    aria-label="Native Stage tools"
                >
                    <BoardToolButton
                        label="Select"
                        icon={MousePointer2}
                        aria-pressed={tool === 'select'}
                        onClick={() => chooseTool('select')}
                    />
                    <BoardToolButton
                        label="Hand"
                        icon={Hand}
                        aria-pressed={tool === 'hand'}
                        onClick={() => chooseTool('hand')}
                    />
                    {(
                        [
                            ['rectangle', Square, 'Rectangle'],
                            ['circle', Circle, 'Circle'],
                            ['triangle', Triangle, 'Triangle'],
                        ] as const
                    ).map(([kind, icon, label]) => (
                        <BoardToolButton
                            key={kind}
                            label={label}
                            icon={icon}
                            aria-pressed={tool === kind}
                            onClick={() => chooseTool(kind)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    runtimeRef.current?.insert(kind);
                                }
                            }}
                        />
                    ))}
                    <BoardToolButton
                        label="Draw"
                        icon={Pencil}
                        aria-pressed={isBoardDrawingTool(tool)}
                        onClick={() => {
                            if (isBoardDrawingTool(tool))
                                setDrawingSettingsOpen(!drawingSettingsOpen);
                            else chooseTool('pen');
                        }}
                    />
                    <BoardToolButton
                        label="Undo"
                        icon={Undo2}
                        disabled={!(historyState & 1)}
                        onClick={() =>
                            runtimeRef.current?.changeHistory('undo')
                        }
                    />
                    <BoardToolButton
                        label="Redo"
                        icon={Redo2}
                        disabled={!(historyState & 2)}
                        onClick={() =>
                            runtimeRef.current?.changeHistory('redo')
                        }
                    />
                    <BoardToolButton
                        label="Toggle grid"
                        icon={Grid2X2}
                        aria-pressed={grid}
                        onClick={() => {
                            runtimeRef.current?.toggleGrid();
                            setGrid(!grid);
                        }}
                    />
                </div>
                <BoardDrawingControls
                    tool={tool}
                    settingsOpen={drawingSettingsOpen}
                    disabled={false}
                    skipExitAnimation={false}
                    onChooseTool={(next) => {
                        if (isBoardDrawingTool(next)) chooseTool(next);
                    }}
                    drawing={{
                        brush,
                        setBrush,
                        smoothing,
                        setSmoothing,
                        eraserSize,
                        setEraserSize,
                        path: {
                            pointCount: pathCount,
                            finish: () => runtimeRef.current?.finishPath(),
                            removeLastPoint: () =>
                                runtimeRef.current?.removeLastPathPoint(),
                            cancel: () => runtimeRef.current?.cancelPath(),
                        },
                    }}
                />
                <BoardNativeSelectionControls
                    object={selected}
                    onChange={(object) =>
                        runtimeRef.current?.changeObject(object)
                    }
                    onLayer={(direction) =>
                        runtimeRef.current?.changeLayer(direction)
                    }
                    onFocusCanvas={() =>
                        hostRef.current?.focus({ preventScroll: true })
                    }
                />
                <div
                    className="board-native-zoom"
                    role="toolbar"
                    aria-label="Native Stage navigation"
                >
                    <BoardToolButton
                        label="Zoom out"
                        icon={Minus}
                        onClick={() =>
                            runtimeRef.current?.camera.zoomBy(1 / 1.2)
                        }
                    />
                    <span ref={zoomRef}>100%</span>
                    <BoardToolButton
                        label="Zoom in"
                        icon={Plus}
                        onClick={() => runtimeRef.current?.camera.zoomBy(1.2)}
                    />
                    <BoardToolButton
                        label="Fit content"
                        icon={Maximize}
                        onClick={() => runtimeRef.current?.fit()}
                    />
                    <BoardToolButton
                        label="Reset camera"
                        icon={RotateCcw}
                        onClick={() => runtimeRef.current?.camera.reset()}
                    />
                </div>
                <details className="board-native-diagnostics">
                    <summary>Stage diagnostics</summary>
                    <label>
                        Replace scratch scene
                        <select
                            defaultValue="0"
                            onChange={(event) => {
                                runtimeRef.current?.replaceFixture(
                                    Number(event.target.value),
                                );
                                setSnapshot('');
                            }}
                        >
                            {[0, 10, 100, 500, 1000].map((count) => (
                                <option key={count} value={count}>
                                    {count} shapes
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={!referenceGraphics.length}
                        onClick={() => {
                            runtimeRef.current?.replaceGraphicsReference(
                                referenceGraphics,
                            );
                            setSnapshot('');
                        }}
                    >
                        Replace scratch with saved ink and shapes
                    </button>
                    <p>
                        Copies graphics only. Rich labels and HTML stay in the
                        saved Board; scratch changes are never saved.
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            setSnapshot(
                                JSON.stringify(
                                    runtimeRef.current?.snapshot(),
                                    null,
                                    2,
                                ),
                            )
                        }
                    >
                        Read snapshot
                    </button>
                    <p>
                        Snapshots are on demand. Wheel pans; Ctrl/Cmd + wheel
                        zooms. Space/middle drag pans. Escape cancels.
                    </p>
                    {snapshot && (
                        <textarea
                            aria-label="Stage diagnostic snapshot"
                            value={snapshot}
                            readOnly
                            rows={12}
                        />
                    )}
                </details>
            </div>
        </section>
    );
}
