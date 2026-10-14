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
            card.removeAttribute('data-layout-animating');
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
            const visibility = original.style.visibility;
            original.style.visibility = 'hidden';
            original.dataset.stackSource = 'true';
            return [
                { card, original, visibility, offset: Math.min(index, 5) * 7 },
            ];
        });
    let ending = false;
    let restoreReceiver: (() => void) | null = null;
    let resolveDropMotion: (() => void) | null = null;
    let resolveReceiverMotion: (() => void) | null = null;
    let receiverTimeline: gsap.core.Timeline | null = null;
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
        receiverTimeline?.kill();
        restoreReceiver?.();
        resolveReceiverMotion?.();
        resolveReceiverMotion = null;
        resolveDropMotion?.();
        resolveDropMotion = null;
        gsap.killTweensOf(cards.map(({ card }) => card));
        for (const { original, visibility } of cards) {
            original.style.visibility = visibility;
            delete original.dataset.stackSource;
        }
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
                scale: 1,
                opacity: 1,
                backgroundColor: appearance.backgroundColor,
                borderColor: appearance.borderColor,
                boxShadow: appearance.boxShadow,
                outlineColor: appearance.outlineColor,
                outlineWidth: appearance.outlineWidth,
                outlineOffset: appearance.outlineOffset,
                duration: 0.42,
                ease: 'power2.inOut',
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
    function finishAtDestination({
        receiver,
        absorb,
    }: {
        receiver: HTMLElement;
        absorb: boolean;
    }): Promise<void> {
        ending = true;
        if (reducedMotion || cards.length === 0) {
            gsap.set(
                cards.map(({ card }) => card),
                { opacity: 0 },
            );
            return Promise.resolve();
        }
        const bounds = receiver.getBoundingClientRect();
        let receiverMotion = Promise.resolve();
        if (absorb) {
            const receiverPreview = receiver.cloneNode(true) as HTMLElement;
            receiverPreview.className =
                'floating-item floating-drag-stack-card';
            receiverPreview.removeAttribute('data-node-id');
            receiverPreview.removeAttribute('data-drop');
            receiverPreview.removeAttribute('data-layout-animating');
            receiverPreview.removeAttribute('tabindex');
            receiverPreview.removeAttribute('role');
            receiverPreview.querySelectorAll('button').forEach((button) => {
                button.disabled = true;
                button.tabIndex = -1;
            });
            layer.appendChild(receiverPreview);
            const visibility = receiver.style.visibility;
            receiver.style.visibility = 'hidden';
            const appearance = getComputedStyle(receiver);
            gsap.set(receiverPreview, {
                x: 0,
                y: 0,
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                minHeight: 0,
                outline: appearance.outline,
                backgroundColor: appearance.backgroundColor,
                borderColor: appearance.borderColor,
                boxShadow: appearance.boxShadow,
            });
            restoreReceiver = () => {
                gsap.killTweensOf(receiverPreview);
                receiver.style.visibility = visibility;
                receiverPreview.remove();
                restoreReceiver = null;
            };
            receiverMotion = new Promise((resolve) => {
                resolveReceiverMotion = resolve;
                receiverTimeline = gsap
                    .timeline({
                        onUpdate: () => {
                            const currentBounds =
                                receiver.getBoundingClientRect();
                            receiverPreview.style.left = `${currentBounds.left}px`;
                            receiverPreview.style.top = `${currentBounds.top}px`;
                            receiverPreview.style.width = `${currentBounds.width}px`;
                            receiverPreview.style.height = `${currentBounds.height}px`;
                            const currentAppearance =
                                getComputedStyle(receiver);
                            receiverPreview.style.outline =
                                currentAppearance.outline;
                            receiverPreview.style.backgroundColor =
                                currentAppearance.backgroundColor;
                            receiverPreview.style.borderColor =
                                currentAppearance.borderColor;
                            receiverPreview.style.boxShadow =
                                currentAppearance.boxShadow;
                        },
                        onComplete: () => {
                            restoreReceiver?.();
                            resolveReceiverMotion = null;
                            resolve();
                        },
                    })
                    .to(receiverPreview, {
                        scale: 1.14,
                        duration: 0.16,
                        ease: 'power2.out',
                    })
                    .to(receiverPreview, {
                        scale: 1,
                        duration: 0.3,
                        ease: 'back.out(1.6)',
                    });
            });
        }
        const cardMotion = new Promise<void>((resolve) => {
            resolveDropMotion = resolve;
            let remaining = cards.length;
            cards.forEach(({ card }, index) => {
                gsap.to(card, {
                    x:
                        bounds.left +
                        bounds.width / 2 -
                        Number(gsap.getProperty(card, 'width')) / 2,
                    y:
                        bounds.top +
                        bounds.height / 2 -
                        Number(gsap.getProperty(card, 'height')) / 2,
                    scale: absorb ? 0.08 : 0.7,
                    opacity: 0,
                    rotation: 0,
                    duration: 0.32,
                    delay: Math.min(index, 5) * 0.025,
                    ease: 'power3.in',
                    overwrite: true,
                    onComplete: () => {
                        remaining -= 1;
                        if (remaining === 0) {
                            resolveDropMotion = null;
                            resolve();
                        }
                    },
                });
            });
        });
        return Promise.all([cardMotion, receiverMotion]).then(() => undefined);
    }
    return { follow, returnToPlaces, finishAtDestination, remove };
}
