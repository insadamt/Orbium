// Summary: Provides the isolated empty Stage/one-Layer baseline before any Orbium graphics or record services mount; depends only on Konva, the Stage camera and on-demand diagnostics.

import Konva from 'konva';
import { useLayoutEffect, useRef, useState } from 'react';
import { createNativeBoardCamera } from './board-native-camera';
import { attachNativeBoardDiagnostics } from './board-native-diagnostics';

export function BoardNativeBaseline() {
    const hostRef = useRef<HTMLDivElement>(null);
    const readSnapshot = useRef<(() => unknown) | null>(null);
    const [snapshot, setSnapshot] = useState('');
    useLayoutEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const stage = new Konva.Stage({
            container: host,
            id: crypto.randomUUID(),
            width: 1,
            height: 1,
            draggable: true,
        });
        const layer = new Konva.Layer();
        const diagnostics = attachNativeBoardDiagnostics(stage, layer);
        stage.add(layer);
        const camera = createNativeBoardCamera(stage);
        stage.on(
            'wheel.baseline',
            (event: Konva.KonvaEventObject<WheelEvent>) => {
                event.evt.preventDefault();
                const pointer = stage.getPointerPosition();
                const unit =
                    event.evt.deltaMode === 1
                        ? 16
                        : event.evt.deltaMode === 2
                          ? stage.height()
                          : 1;
                if ((event.evt.ctrlKey || event.evt.metaKey) && pointer)
                    camera.zoomAt(
                        pointer,
                        stage.scaleX() *
                            Math.exp(-event.evt.deltaY * unit * 0.005),
                    );
                else
                    camera.apply({
                        ...camera.read(),
                        x: stage.x() - event.evt.deltaX * unit,
                        y: stage.y() - event.evt.deltaY * unit,
                    });
            },
        );
        const resize = () => {
            const width = Math.max(1, Math.round(host.clientWidth));
            const height = Math.max(1, Math.round(host.clientHeight));
            const ratio = window.devicePixelRatio || 1;
            if (layer.getCanvas().getPixelRatio() !== ratio) {
                layer.getCanvas().setPixelRatio(ratio);
                diagnostics.counters.resolutionChanges++;
            }
            if (stage.width() !== width || stage.height() !== height) {
                stage.size({ width, height });
                diagnostics.counters.viewportResizes++;
            }
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        window.addEventListener('resize', resize);
        resize();
        readSnapshot.current = diagnostics.snapshot;
        return () => {
            readSnapshot.current = null;
            observer.disconnect();
            window.removeEventListener('resize', resize);
            stage.stopDrag();
            diagnostics.dispose();
            stage.destroy();
        };
    }, []);

    return (
        <section
            className="board-workspace"
            aria-label="Empty Konva Stage baseline"
        >
            <div className="board-stage">
                <div
                    ref={hostRef}
                    className="board-canvas"
                    data-board-renderer="native-empty"
                    role="region"
                    aria-label="Empty Stage baseline canvas"
                    tabIndex={0}
                />
                <p className="board-native-notice">
                    Empty Stage baseline · One empty Layer · No Board objects or
                    editors
                </p>
                <details className="board-native-diagnostics">
                    <summary>Baseline diagnostics</summary>
                    <button
                        type="button"
                        onClick={() =>
                            setSnapshot(
                                JSON.stringify(
                                    readSnapshot.current?.(),
                                    null,
                                    2,
                                ),
                            )
                        }
                    >
                        Read snapshot
                    </button>
                    <p>
                        Drag/wheel pans. Ctrl/Cmd + wheel zooms. No grid,
                        selection or record store is mounted.
                    </p>
                    {snapshot && (
                        <textarea
                            aria-label="Empty Stage diagnostic snapshot"
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
