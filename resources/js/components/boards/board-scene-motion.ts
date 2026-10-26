import type { BoardRecordStore, BoardVisualChange } from './board-record-store';
import { BoardMotionEffects } from './board-motion-effects';
import { createBoardDeletionPreview } from './board-deletion-preview';

export function mountBoardSceneMotion(
    store: BoardRecordStore,
    viewport: HTMLElement,
    world: HTMLElement,
    layer: HTMLElement,
) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const effects = new BoardMotionEffects(reduced);
    const pending = new Map<
        string,
        { kind: 'create' | 'update'; expires: number }
    >();
    const exits = new Map<string, HTMLElement>();
    let frame: number | undefined;
    const elementFor = (id: string) =>
        world.querySelector<HTMLElement>(`[data-board-object-id="${id}"]`);
    const visible = (element: HTMLElement) => {
        const bounds = element.getBoundingClientRect();
        const area = viewport.getBoundingClientRect();
        return (
            bounds.width * bounds.height <= 2_000_000 &&
            bounds.right >= area.left &&
            bounds.left <= area.right &&
            bounds.bottom >= area.top &&
            bounds.top <= area.bottom
        );
    };
    const clear = () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = undefined;
        pending.clear();
        effects.clear();
        for (const exit of exits.values()) exit.remove();
        exits.clear();
    };
    const removeExit = (id: string) => {
        const exit = exits.get(id);
        if (exit) {
            effects.cancel(exit);
            exit.remove();
            exits.delete(id);
        }
    };
    const flush = () => {
        frame = undefined;
        for (const [id, entry] of pending) {
            if (performance.now() > entry.expires) {
                pending.delete(id);
                continue;
            }
            const element = elementFor(id);
            if (!element) continue;
            pending.delete(id);
            if (reduced.matches || !visible(element)) continue;
            const body =
                element.querySelector<HTMLElement>('.board-object-body');
            if (!body) continue;
            //
            // Editors and freshly released ink stay spatially steady; only inactive block surfaces get the small creation pop.
            //
            if (
                element.dataset.editing === 'true' ||
                element.dataset.boardKind === 'drawing'
            )
                effects.play(body, [{ opacity: 0.65 }, { opacity: 1 }], 140);
            else
                effects.play(
                    body,
                    [
                        { opacity: 0, scale: 0.96, translate: '0 4px' },
                        { opacity: 1, scale: 1, translate: '0 0' },
                    ],
                    entry.kind === 'create' ? 180 : 140,
                );
        }
    };
    const schedule = () => {
        if (pending.size && frame === undefined)
            frame = requestAnimationFrame(flush);
    };
    const onChange = ({ changes, kind }: BoardVisualChange) => {
        if (kind === 'reset') {
            clear();
            return;
        }
        if (reduced.matches) return;
        let budget = 24;
        let rendered: Map<string, HTMLElement> | undefined;
        for (const { id, before, after } of changes.values()) {
            if (!after) pending.delete(id);
            if (after) removeExit(id);
            if (budget <= 0) continue;
            if (!before && after) {
                pending.set(id, {
                    kind: 'create',
                    expires: performance.now() + 250,
                });
                budget--;
            } else if (before && !after) {
                removeExit(id);
                if (!rendered) {
                    rendered = new Map();
                    for (const child of world.children) {
                        if (
                            child instanceof HTMLElement &&
                            child.dataset.boardObjectId
                        )
                            rendered.set(child.dataset.boardObjectId, child);
                    }
                }
                const element = rendered.get(id);
                if (!element || !visible(element)) continue;
                while (exits.size >= 16) removeExit(exits.keys().next().value!);
                const preview = createBoardDeletionPreview(element, before);
                layer.append(preview);
                exits.set(id, preview);
                effects.play(
                    preview,
                    [
                        { opacity: 1, scale: 1 },
                        { opacity: 0, scale: 0.94 },
                    ],
                    140,
                    () => {
                        preview.remove();
                        if (exits.get(id) === preview) exits.delete(id);
                    },
                );
                budget--;
            } else if (
                before &&
                after &&
                (before.block_type !== after.block_type ||
                    before.data.align !== after.data.align ||
                    before.data.dir !== after.data.dir ||
                    before.data.list_style !== after.data.list_style)
            ) {
                pending.set(id, {
                    kind: 'update',
                    expires: performance.now() + 250,
                });
                budget--;
            }
        }
        while (pending.size > 48) pending.delete(pending.keys().next().value!);
        schedule();
    };
    const unsubscribe = store.subscribeVisualChanges(onChange);
    const observer = new MutationObserver(schedule);
    observer.observe(world, { childList: true });
    const edit = (event: Event) => {
        const body = event.target;
        if (body instanceof HTMLElement && body.matches('.board-object-body'))
            effects.play(body, [{ opacity: 0.72 }, { opacity: 1 }], 120);
    };
    const check = (event: Event) => {
        const target = event.target;
        if (
            target instanceof HTMLInputElement &&
            target.matches('.board-list-item input[type="checkbox"]')
        )
            effects.play(
                target,
                [{ scale: 0.88 }, { scale: 1.1, offset: 0.55 }, { scale: 1 }],
                150,
            );
    };
    viewport.addEventListener('board-edit-state', edit);
    viewport.addEventListener('change', check);
    reduced.addEventListener('change', clear);
    return () => {
        unsubscribe();
        observer.disconnect();
        clear();
        viewport.removeEventListener('board-edit-state', edit);
        viewport.removeEventListener('change', check);
        reduced.removeEventListener('change', clear);
    };
}
