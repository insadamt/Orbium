export function mountBoardToolbarMotion(surface: HTMLElement) {
    //
    // Keep motion on the live surface: cloned exits can outlive selection changes and appear beside the next toolbar.
    //
    surface.classList.add('board-animated-toolbar');
    return () => surface.classList.remove('board-animated-toolbar');
}
