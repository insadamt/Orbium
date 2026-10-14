import { gsap } from 'gsap';
import type { TreeNode } from '@/components/navigation/navigation-types';

type PointerPosition = { x: number; y: number };

export function createExplorerDragPreview(
    source: HTMLElement,
    draggedNodes: TreeNode[],
    pointer: PointerPosition,
) {
    const container = source.closest('.floating-contents');
    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;
    const layer = document.createElement('div');
    layer.className = 'floating-drag-stack';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const cards = [...draggedNodes]
        .sort((a, b) => a.position - b.position || a.id - b.id)
        .flatMap((node, index) => {
            const original = container?.querySelector<HTMLElement>(
                `[data-node-id="${node.id}"]`,
            );
            if (!original) return [];
            const bounds = original.getBoundingClientRect();
            const card = original.cloneNode(true) as HTMLElement;
            card.className = 'floating-item floating-drag-stack-card';
            card.removeAttribute('data-node-id');
            card.removeAttribute('data-dragging');
            card.removeAttribute('data-drop');
            card.removeAttribute('role');
            card.removeAttribute('tabindex');
            card.querySelectorAll('button').forEach((button) => {
                button.tabIndex = -1;
                button.disabled = true;
            });
            card.querySelectorAll('[id]').forEach((element) =>
                element.removeAttribute('id'),
            );
            card.style.minHeight = '0';
            card.style.zIndex = String(draggedNodes.length - index);
            layer.appendChild(card);
            gsap.set(card, {
                x: bounds.left,
                y: bounds.top,
                width: bounds.width,
                height: bounds.height,
            });
            return [{ card, original, offset: Math.min(index, 5) * 7 }];
        });
    let ending = false;
    const sourceBounds = source.getBoundingClientRect();
    const stackWidth = Math.min(
        sourceBounds.width,
        248,
        window.innerWidth - 48,
    );
    const stackHeight =
        source.dataset.view === 'gallery'
            ? (sourceBounds.height * stackWidth) / sourceBounds.width
            : sourceBounds.height;
    function follow(nextPointer: PointerPosition, duration = 0.16) {
        if (ending) return;
        for (const { card, offset } of cards) {
            gsap.to(card, {
                x: nextPointer.x - stackWidth / 2 + offset,
                y: nextPointer.y - stackHeight / 2 + offset,
                width: stackWidth,
                height: stackHeight,
                rotation: offset / 14,
                duration: reducedMotion ? 0 : duration,
                ease: 'power3.out',
                overwrite: true,
            });
        }
    }
    follow(pointer, 0.32);
    function remove() {
        ending = true;
        gsap.killTweensOf(cards.map(({ card }) => card));
        layer.remove();
    }
    function handOffToOriginalCards(onComplete: () => void) {
        const transitions = cards.map(({ original }) => ({
            original,
            transition: original.style.transition,
        }));
        // Disable the source opacity transition while React reveals it beneath the settled preview.
        for (const { original } of transitions)
            original.style.transition = 'none';
        onComplete();
        remove();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                for (const { original, transition } of transitions)
                    original.style.transition = transition;
            });
        });
    }
    function returnToPlaces(onComplete: () => void) {
        ending = true;
        if (reducedMotion || cards.length === 0) {
            handOffToOriginalCards(onComplete);
            return;
        }
        let remaining = cards.length;
        for (const { card, original } of cards) {
            const bounds = original.getBoundingClientRect();
            const appearance = getComputedStyle(original);
            gsap.to(card, {
                x: bounds.left,
                y: bounds.top,
                width: bounds.width,
                height: bounds.height,
                rotation: 0,
                backgroundColor: appearance.backgroundColor,
                borderColor: appearance.borderColor,
                boxShadow: appearance.boxShadow,
                outlineColor: appearance.outlineColor,
                outlineWidth: appearance.outlineWidth,
                outlineOffset: appearance.outlineOffset,
                duration: 0.3,
                ease: 'power3.inOut',
                overwrite: true,
                onComplete: () => {
                    remaining -= 1;
                    if (remaining === 0) {
                        handOffToOriginalCards(onComplete);
                    }
                },
            });
        }
    }
    return { follow, returnToPlaces, remove };
}
