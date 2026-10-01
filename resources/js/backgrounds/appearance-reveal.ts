import { flushSync } from 'react-dom';

let activeReveal: ViewTransition | null = null;

export function revealAppearanceFromCenter(applyAppearance: () => void): void {
    const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;

    activeReveal?.skipTransition();
    if (
        reduceMotion ||
        !document.startViewTransition ||
        document.visibilityState !== 'visible'
    ) {
        activeReveal = null;
        document.documentElement.classList.remove('appearance-circle-reveal');
        applyAppearance();
        return;
    }

    document.documentElement.classList.add('appearance-circle-reveal');
    const reveal = document.startViewTransition(() =>
        flushSync(applyAppearance),
    );
    activeReveal = reveal;

    const finishReveal = () => {
        if (activeReveal !== reveal) return;
        activeReveal = null;
        document.documentElement.classList.remove('appearance-circle-reveal');
    };
    void reveal.finished.then(finishReveal, finishReveal);
}
