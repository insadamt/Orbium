import { prefersReducedOutlineMotion } from './outline-navigation-motion';

function scrollRailToCurrentHeading(rail: HTMLElement) {
    const mark = rail.querySelector<HTMLElement>('[data-current="true"]');
    const behavior = prefersReducedOutlineMotion() ? 'instant' : 'smooth';
    if (!mark) {
        rail.scrollTo({ top: 0, behavior });
        return;
    }
    const railBounds = rail.getBoundingClientRect();
    const markBounds = mark.getBoundingClientRect();
    const inset = 12;
    if (
        markBounds.top >= railBounds.top + inset &&
        markBounds.bottom <= railBounds.bottom - inset
    )
        return;
    const markTop = markBounds.top - railBounds.top + rail.scrollTop;
    const destination =
        markBounds.top < railBounds.top + inset
            ? markTop - inset
            : markTop + markBounds.height - rail.clientHeight + inset;
    rail.scrollTo({ top: Math.max(0, destination), behavior });
}

export function attachOutlineRailFollowing(rail: HTMLElement): () => void {
    scrollRailToCurrentHeading(rail);
    const observer = new ResizeObserver(() => scrollRailToCurrentHeading(rail));
    observer.observe(rail);
    return () => {
        observer.disconnect();
        rail.scrollTo({ top: rail.scrollTop, behavior: 'instant' });
    };
}
