import { AppSelect } from '@/components/ui/app-select';
import { blockStyleTypes, type EditorStyles } from './block-style-types';
import type { StyleDiagnostic, StyleSource } from './style-diagnostics';
import {
    styleNavigationGroups,
    styleSourceLabel,
} from './style-workspace-options';

type Props = {
    source: StyleSource;
    styles: EditorStyles;
    diagnostics: StyleDiagnostic[];
    onSelect: (source: StyleSource) => void;
};

export default function StyleNavigation({
    source,
    styles,
    diagnostics,
    onSelect,
}: Props) {
    function marker(key: StyleSource) {
        if (diagnostics.some((item) => item.source === key)) return 'Error';
        if (key === 'base' && styles.stylesheet.trim()) return 'Custom';
        if (key !== 'base' && styles.overrides[key]?.trim()) return 'Override';
        return '';
    }
    return (
        <>
            <nav className="editor-style-navigation" aria-label="Block styles">
                {styleNavigationGroups.map((group) => (
                    <section key={group.title}>
                        <h3>{group.title}</h3>
                        {group.sources.map((key) => (
                            <button
                                key={key}
                                type="button"
                                aria-current={
                                    source === key ? 'true' : undefined
                                }
                                onClick={() => onSelect(key)}
                            >
                                <span>{styleSourceLabel(key)}</span>
                                <span
                                    className={
                                        marker(key) === 'Error'
                                            ? 'text-destructive'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    {marker(key)}
                                </span>
                            </button>
                        ))}
                    </section>
                ))}
            </nav>
            <div className="editor-style-compact-navigation">
                <AppSelect
                    label="Styles to edit"
                    value={source}
                    onValueChange={(value) => onSelect(value as StyleSource)}
                    options={[
                        'base' as const,
                        ...blockStyleTypes.map(([type]) => type),
                    ].map((key) => ({
                        value: key,
                        label: `${styleSourceLabel(key)}${marker(key) ? ` · ${marker(key)}` : ''}`,
                    }))}
                />
            </div>
        </>
    );
}
