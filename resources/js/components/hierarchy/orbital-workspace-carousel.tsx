import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkspaceSummary } from './workspace-panel';

type Props = {
    workspaces: WorkspaceSummary[];
    selectedIndex: number;
    stageWidth: number;
    onSelect: (index: number) => void;
    onEnter: () => void;
    wasDragged: () => boolean;
};

export default function OrbitalWorkspaceCarousel({
    workspaces,
    selectedIndex,
    stageWidth,
    onSelect,
    onEnter,
    wasDragged,
}: Props) {
    const visiblePositions =
        workspaces.length > 1
            ? Array.from({ length: 7 }, (_, index) => selectedIndex + index - 3)
            : [selectedIndex];

    return (
        <div
            className="orbital-workspace-field"
            role="region"
            aria-roledescription="carousel"
            aria-label="Workspace carousel"
        >
            <div className="orbital-workspace-track" aria-hidden="true" />
            {visiblePositions.map((position) => {
                const workspace =
                    workspaces[
                        ((position % workspaces.length) + workspaces.length) %
                            workspaces.length
                    ];
                const offset = position - selectedIndex;
                const isPreview = Math.abs(offset) === 1;
                const isInteractive = offset === 0 || isPreview;
                return (
                    <button
                        key={position}
                        type="button"
                        className={`orbital-workspace-orb orbital-workspace-orb--${Math.min(Math.abs(offset), 3)}`}
                        style={{
                            left: `calc(52% + ${offset * Math.min(stageWidth * 0.48, 680)}px)`,
                            zIndex: 5 - Math.abs(offset),
                        }}
                        aria-label={`${workspace.name}${offset === 0 ? ', selected; open workspace' : offset < 0 ? ', previous workspace' : ', next workspace'}`}
                        aria-current={offset === 0 ? 'true' : undefined}
                        aria-hidden={!isInteractive}
                        tabIndex={isInteractive ? 0 : -1}
                        onClick={() => {
                            if (wasDragged() || !isInteractive) return;
                            if (offset === 0) onEnter();
                            else onSelect(position);
                        }}
                    >
                        <span
                            className="orbital-workspace-surface"
                            aria-hidden="true"
                        />
                        <span className="orbital-workspace-name">
                            {workspace.name}
                        </span>
                        {offset === 0 && (
                            <span className="orbital-workspace-hint">
                                ENTER SPACE ↗
                            </span>
                        )}
                    </button>
                );
            })}
            {workspaces.length > 1 && (
                <div className="orbital-workspace-navigation">
                    <button
                        type="button"
                        aria-label="Previous workspace"
                        onClick={() => onSelect(selectedIndex - 1)}
                    >
                        <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <span aria-live="polite">
                        {String(
                            (((selectedIndex % workspaces.length) +
                                workspaces.length) %
                                workspaces.length) +
                                1,
                        ).padStart(2, '0')}
                        <span className="orbital-workspace-navigation-divider">
                            {' '}
                            /{' '}
                        </span>
                        {String(workspaces.length).padStart(2, '0')}
                    </span>
                    <button
                        type="button"
                        aria-label="Next workspace"
                        onClick={() => onSelect(selectedIndex + 1)}
                    >
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}
