import { clamp } from './board-geometry';
import { boardLimits, type BoardObject } from './board-types';

export function isBoardWriting(object: BoardObject) {
    return ['text', 'heading', 'list', 'quote', 'callout'].includes(
        object.block_type,
    );
}

export function supportsBoardContentHeight(object: BoardObject) {
    return (
        isBoardWriting(object) ||
        ['table', 'code', 'math', 'mermaid', 'file'].includes(object.block_type)
    );
}

export function measureBoardContentHeight(preview: HTMLElement) {
    const style = getComputedStyle(preview);
    const scale = Number(style.getPropertyValue('--board-content-scale')) || 1;
    //
    // CSS zoom changes visual geometry; scrollHeight remains in the block's unscaled layout units.
    //
    return clamp(
        ((preview.firstElementChild?.scrollHeight ?? 0) +
            parseFloat(style.paddingTop) +
            parseFloat(style.paddingBottom)) *
            scale +
            2,
        boardLimits.minHeight,
        boardLimits.maxSize,
    );
}
