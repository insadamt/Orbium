import {
    adjustEditorPerformanceCounter,
    measureEditorWork,
} from '@/lib/editor-performance';
import { normalizeEditorStyles, type EditorStyles } from './block-style-types';
import { compileEditorStyles } from './compile-editor-styles';

type SavedStyleCompilation = {
    userId: number;
    styleConfiguration: string;
};

let lastCompilation: (SavedStyleCompilation & { css: string }) | undefined;

export function serializeNormalizedEditorStyles(styles?: EditorStyles | null) {
    return JSON.stringify(normalizeEditorStyles(styles));
}

export function compileSavedEditorStyles(configuration: SavedStyleCompilation) {
    if (
        lastCompilation?.userId === configuration.userId &&
        lastCompilation.styleConfiguration === configuration.styleConfiguration
    )
        return lastCompilation.css;

    const styles = JSON.parse(configuration.styleConfiguration) as EditorStyles;
    let css = '';
    if (styles.enabled) {
        adjustEditorPerformanceCounter('editor-styles.compilations', 1);
        try {
            css = measureEditorWork('editor-styles.compile', () =>
                compileEditorStyles(styles, '[data-document-styles]'),
            );
        } catch {
            css = '';
        }
    }
    // One entry also covers Strict Mode replay without retaining a history of account themes.
    lastCompilation = { ...configuration, css };
    return css;
}
