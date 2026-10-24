type BoardWorkKind = 'fetch' | 'render';
type BoardWork = {
    kind: BoardWorkKind;
    run: () => void | Promise<void>;
    priority: () => number;
    queuedAt: number;
};

export class BoardWorkScheduler {
    private jobs = new Set<BoardWork>();
    private active = { fetch: 0, render: 0 };
    private started = { fetch: 0, render: 0 };
    private timer: ReturnType<typeof setTimeout> | undefined;
    private documentVisible =
        typeof document === 'undefined' || !document.hidden;

    enqueue(
        kind: BoardWorkKind,
        run: BoardWork['run'],
        priority: BoardWork['priority'],
    ) {
        const job = { kind, run, priority, queuedAt: performance.now() };
        this.jobs.add(job);
        this.schedule();
        return () => {
            this.jobs.delete(job);
            if (!this.jobs.size) {
                clearTimeout(this.timer);
                this.timer = undefined;
            }
        };
    }

    cancelPending() {
        clearTimeout(this.timer);
        this.timer = undefined;
        this.jobs.clear();
    }

    setDocumentVisible(visible: boolean) {
        this.documentVisible = visible;
        if (visible) this.schedule();
        else {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    snapshot() {
        return {
            pending: this.jobs.size,
            active: { ...this.active },
            started: { ...this.started },
            timerScheduled: this.timer !== undefined,
            documentVisible: this.documentVisible,
        };
    }

    private schedule(delay = 0) {
        if (
            !this.documentVisible ||
            this.timer !== undefined ||
            !this.jobs.size
        )
            return;
        if (this.active.fetch >= 2 && this.active.render >= 1) return;
        this.timer = setTimeout(() => {
            this.timer = undefined;
            const now = performance.now();
            const next = this.chooseNextJob(now);
            if (!next) return;
            const scheduling = (
                navigator as Navigator & {
                    scheduling?: { isInputPending: () => boolean };
                }
            ).scheduling;
            //
            // Yield to current input, but cap postponement so continuously panning never starves readable content.
            //
            if (
                next.kind === 'render' &&
                now - next.queuedAt < 120 &&
                scheduling?.isInputPending()
            ) {
                this.schedule(16);
                return;
            }
            this.jobs.delete(next);
            this.active[next.kind]++;
            this.started[next.kind]++;
            void Promise.resolve()
                .then(next.run)
                .catch(() => {
                    //
                    // Renderers own their visible error state; a failed job must still release the shared concurrency slot.
                    //
                })
                .finally(() => {
                    this.active[next.kind]--;
                    this.schedule();
                });
            this.schedule();
        }, delay);
    }

    private chooseNextJob(now: number) {
        let next: BoardWork | undefined;
        let nextRank = Infinity;
        //
        // Only the best runnable job is needed; sorting the entire queue again for every preview adds avoidable work on dense Boards.
        //
        for (const job of this.jobs) {
            if (this.active[job.kind] >= (job.kind === 'fetch' ? 2 : 1))
                continue;
            const rank = this.rank(job, now);
            if (
                rank < nextRank ||
                (rank === nextRank && (!next || job.queuedAt < next.queuedAt))
            ) {
                next = job;
                nextRank = rank;
            }
        }
        return next;
    }

    private rank(job: BoardWork, now: number) {
        return Math.max(
            0,
            job.priority() - Math.floor((now - job.queuedAt) / 1000),
        );
    }
}
