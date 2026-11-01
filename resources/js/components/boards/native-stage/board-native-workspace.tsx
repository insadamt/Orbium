// Summary: Presents the isolated, unsaved Phase-1 Stage with existing Board control styling and manual fixture/profiling actions; depends on the imperative native Stage owner.

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
} from 'lucide-react';
import { BoardToolButton } from '../board-tool-button';
import {
    createNativeBoardStage,
    type NativeBoardStage,
} from './board-native-stage';
import type { NativeBoardTool } from './board-native-interactions';
import { BoardNativeBaseline } from './board-native-baseline';
import './board-native-stage.css';

export default function BoardNativeWorkspace({
    baseline,
}: {
    baseline: boolean;
}) {
    return baseline ? <BoardNativeBaseline /> : <BoardNativeFoundation />;
}

function BoardNativeFoundation() {
    const hostRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLSpanElement>(null);
    const runtimeRef = useRef<NativeBoardStage | null>(null);
    const [tool, setTool] = useState<NativeBoardTool>('select');
    const [grid, setGrid] = useState(true);
    const [snapshot, setSnapshot] = useState('');
    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        const host = hostRef.current;
        const zoomLabel = zoomRef.current;
        if (!host || !zoomLabel) return;
        let runtime: NativeBoardStage;
        try {
            runtime = createNativeBoardStage(host, zoomLabel);
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

    function chooseTool(next: NativeBoardTool) {
        runtimeRef.current?.setTool(next);
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
                    Phase 1 preview · Unsaved scratch scene · Existing Board
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
                        label="Toggle grid"
                        icon={Grid2X2}
                        aria-pressed={grid}
                        onClick={() => {
                            runtimeRef.current?.toggleGrid();
                            setGrid(!grid);
                        }}
                    />
                </div>
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
