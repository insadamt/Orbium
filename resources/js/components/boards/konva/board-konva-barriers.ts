// Summary: Retains native outline stacking until existing hover/selection fades finish; depends on bounded event-driven expiry and the original 140ms outline transition.

export class BoardKonvaBarriers {
    private active = new Set<string>();
    private fading = new Map<string, number>();
    private timer: number | undefined;

    constructor(private invalidate: () => void) {}

    update(ids: Iterable<string>) {
        const next = new Set(ids);
        for (const id of this.active)
            if (!next.has(id)) this.fading.set(id, performance.now() + 160);
        for (const id of next) this.fading.delete(id);
        this.active = next;
        this.scheduleExpiry();
    }

    read() {
        return new Set([...this.active, ...this.fading.keys()]);
    }

    dispose() {
        clearTimeout(this.timer);
        this.timer = undefined;
        this.active.clear();
        this.fading.clear();
    }

    private scheduleExpiry() {
        clearTimeout(this.timer);
        this.timer = undefined;
        if (!this.fading.size) return;
        let expires = Infinity;
        for (const expiry of this.fading.values())
            expires = Math.min(expires, expiry);
        this.timer = window.setTimeout(
            () => {
                for (const [id, expiry] of this.fading)
                    if (expiry <= performance.now()) this.fading.delete(id);
                this.scheduleExpiry();
                this.invalidate();
            },
            Math.max(1, expires - performance.now()),
        );
    }
}
