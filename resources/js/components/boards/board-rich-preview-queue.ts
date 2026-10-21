import type { BoardWorkScheduler } from './board-work-scheduler';

export function createBoardRichPreviewQueue(
    root: HTMLElement,
    scheduler: BoardWorkScheduler,
) {
    const priorities = new Map<HTMLElement, number>();
    const cancellations = new Set<() => void>();
    let destroyed = false;
    const observer =
        typeof IntersectionObserver === 'undefined'
            ? null
            : new IntersectionObserver(
                  (entries) => {
                      for (const entry of entries) {
                          if (!priorities.has(entry.target as HTMLElement))
                              continue;
                          priorities.set(
                              entry.target as HTMLElement,
                              entry.isIntersecting ? 0 : 1,
                          );
                      }
                  },
                  { root: root.closest('.board-canvas') },
              );
    return {
        enqueue(element: HTMLElement, render: () => void | Promise<void>) {
            priorities.set(element, observer ? 1 : 0);
            observer?.observe(element);
            const cancel = scheduler.enqueue(
                'render',
                async () => {
                    cancellations.delete(cancel);
                    observer?.unobserve(element);
                    priorities.delete(element);
                    if (destroyed || !element.isConnected) return;
                    element.replaceChildren();
                    try {
                        await render();
                    } catch {
                        if (destroyed || !element.isConnected) return;
                        element.textContent =
                            'Could not render this preview. Reopen the block to retry.';
                    }
                },
                () => priorities.get(element) ?? 1,
            );
            cancellations.add(cancel);
            return () => {
                cancel();
                cancellations.delete(cancel);
                observer?.unobserve(element);
                priorities.delete(element);
            };
        },
        destroy() {
            destroyed = true;
            observer?.disconnect();
            cancellations.forEach((cancel) => cancel());
            cancellations.clear();
            priorities.clear();
        },
    };
}
