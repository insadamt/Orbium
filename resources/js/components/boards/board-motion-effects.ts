// Summary: Owns finite native Board feedback and its graphics notification; depends on WAAPI and the user's reduced-motion preference.

export class BoardMotionEffects {
    private running = new Map<Element, Animation>();

    constructor(private reducedMotion: MediaQueryList) {}

    play(
        target: Element,
        frames: Keyframe[],
        duration: number,
        complete?: () => void,
    ) {
        this.cancel(target);
        if (
            this.reducedMotion.matches ||
            typeof target.animate !== 'function'
        ) {
            complete?.();
            return;
        }
        if (this.running.size >= 48) {
            const oldest = this.running.keys().next().value;
            if (oldest) this.cancel(oldest);
        }
        const animation = target.animate(frames, {
            duration,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        });
        this.running.set(target, animation);
        target.dispatchEvent(
            new CustomEvent('board-graphic-motion', {
                bubbles: true,
                detail: { animation, frames },
            }),
        );
        const finish = () => {
            if (this.running.get(target) === animation)
                this.running.delete(target);
            complete?.();
        };
        void animation.finished.then(finish, finish);
    }

    cancel(target: Element) {
        this.running.get(target)?.cancel();
        this.running.delete(target);
    }

    clear() {
        for (const animation of this.running.values()) animation.cancel();
        this.running.clear();
    }
}
