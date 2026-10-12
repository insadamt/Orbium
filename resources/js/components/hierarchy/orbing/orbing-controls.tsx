import { Crosshair, Maximize, Minus, Pause, Play, Plus } from 'lucide-react';
import type { TreeNode } from '@/components/navigation/navigation-types';

export function OrbingCameraControls({
    zoom,
    selected,
    motionEnabled,
    reducedMotion,
    onToggleMotion,
    onZoom,
    onFit,
    onFocus,
}: {
    zoom: number;
    selected: boolean;
    motionEnabled: boolean;
    reducedMotion: boolean;
    onToggleMotion: () => void;
    onZoom: (factor: number) => void;
    onFit: () => void;
    onFocus: () => void;
}) {
    return (
        <div
            className="orbing-camera-controls floating-surface"
            data-orbing-controls="true"
            role="group"
            aria-label="Orbing camera"
        >
            <button
                type="button"
                onClick={() => onZoom(1 / 1.25)}
                aria-label="Zoom out"
                title="Zoom out"
            >
                <Minus size={16} />
            </button>
            <output aria-label="Zoom level">
                {zoom < 0.01 ? (zoom * 100).toFixed(1) : Math.round(zoom * 100)}
                %
            </output>
            <button
                type="button"
                onClick={() => onZoom(1.25)}
                aria-label="Zoom in"
                title="Zoom in"
            >
                <Plus size={16} />
            </button>
            <span className="orbing-control-divider" />
            <button
                type="button"
                onClick={onFit}
                aria-label="Fit view"
                title="Fit view"
            >
                <Maximize size={16} />
            </button>
            <button
                type="button"
                disabled={!selected}
                onClick={onFocus}
                aria-label="Focus selected"
                title="Focus selected"
            >
                <Crosshair size={16} />
            </button>
            <button
                type="button"
                disabled={reducedMotion}
                onClick={onToggleMotion}
                aria-label={
                    motionEnabled
                        ? 'Pause orbital motion'
                        : 'Resume orbital motion'
                }
                title={
                    reducedMotion
                        ? 'Reduced motion is enabled'
                        : motionEnabled
                          ? 'Pause orbital motion'
                          : 'Resume orbital motion'
                }
            >
                {motionEnabled && !reducedMotion ? (
                    <Pause size={15} />
                ) : (
                    <Play size={15} />
                )}
            </button>
        </div>
    );
}

export function OrbingSelection({
    node,
    parentTitle,
    onOpen,
    onClear,
}: {
    node: TreeNode;
    parentTitle: string;
    onOpen: () => void;
    onClear: () => void;
}) {
    return (
        <div
            className="orbing-selection floating-surface"
            data-orbing-controls="true"
        >
            <span className="orbing-selection-path">
                {parentTitle} / {node.type}
            </span>
            <strong>{node.title}</strong>
            <div className="orbing-selection-actions">
                <button type="button" onClick={onOpen}>
                    Open
                </button>
                <button type="button" onClick={onClear}>
                    Deselect
                </button>
            </div>
        </div>
    );
}
