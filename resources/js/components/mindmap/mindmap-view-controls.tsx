import { Minus, Plus, Scan } from 'lucide-react';
import { BoardToolButton } from '@/components/boards/board-tool-button';
export function MindMapViewControls({
    scale,
    onZoom,
    onFit,
}: {
    scale: number;
    onZoom: (scale: number) => void;
    onFit: () => void;
}) {
    return (
        <div
            className="mindmap-view-controls"
            role="group"
            aria-label="Mind Map view"
        >
            <BoardToolButton
                label="Zoom out Mind Map"
                icon={Minus}
                tooltipClassName="mindmap-tool-tooltip"
                onClick={() => onZoom(Math.max(0.0001, scale / 1.25))}
            />
            <output aria-label="Mind Map zoom">
                {Math.round(scale * 100)}%
            </output>
            <BoardToolButton
                label="Zoom in Mind Map"
                icon={Plus}
                tooltipClassName="mindmap-tool-tooltip"
                onClick={() => onZoom(Math.min(2.5, scale * 1.25))}
            />
            <span className="mindmap-tool-separator" />
            <BoardToolButton
                label="Fit Mind Map"
                icon={Scan}
                tooltipClassName="mindmap-tool-tooltip"
                onClick={onFit}
            />
        </div>
    );
}
