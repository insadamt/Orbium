import { PanelRightOpen } from 'lucide-react';
import {
    insightLabels,
    type StatisticsInsight,
} from './statistics-insight-types';

export function StatisticsInspectButton({
    metric,
    selectedMetric,
    onInspect,
}: {
    metric: StatisticsInsight;
    selectedMetric: StatisticsInsight | null;
    onInspect: (metric: StatisticsInsight, trigger: HTMLButtonElement) => void;
}) {
    const label = `Inspect ${insightLabels[metric].toLowerCase()}`;
    return (
        <button
            type="button"
            className="statistics-inspect-button"
            aria-label={label}
            title={label}
            aria-expanded={selectedMetric === metric}
            onClick={(event) => onInspect(metric, event.currentTarget)}
        >
            <PanelRightOpen size={16} aria-hidden="true" />
        </button>
    );
}
