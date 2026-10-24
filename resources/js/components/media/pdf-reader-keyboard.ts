export function mountPdfReaderKeyboard(
    viewport: HTMLElement,
    actions: {
        readPage: () => number;
        readPageCount: () => number;
        readScale: () => number;
        changePage: (page: number) => void;
        changeZoom: (zoom: number) => void;
    },
) {
    const handleKey = (event: KeyboardEvent) => {
        if (
            event.target !== viewport ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        )
            return;
        if (event.key === 'ArrowLeft' || event.key === 'PageUp')
            actions.changePage(actions.readPage() - 1);
        else if (event.key === 'ArrowRight' || event.key === 'PageDown')
            actions.changePage(actions.readPage() + 1);
        else if (event.key === 'Home') actions.changePage(1);
        else if (event.key === 'End')
            actions.changePage(actions.readPageCount() || 1);
        else if (event.key === '+' || event.key === '=')
            actions.changeZoom(actions.readScale() * 1.25);
        else if (event.key === '-')
            actions.changeZoom(actions.readScale() / 1.25);
        else return;
        event.preventDefault();
        event.stopPropagation();
    };
    viewport.addEventListener('keydown', handleKey);
    return () => viewport.removeEventListener('keydown', handleKey);
}
