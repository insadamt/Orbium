import { gsap } from 'gsap';

export function animateTrashAmbient(ambient: HTMLElement, active: boolean) {
    const layers = ambient.querySelectorAll<HTMLElement>(
        '.explorer-trash-glow-layer',
    );
    const preferences = gsap.matchMedia();
    preferences.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(ambient, {
            opacity: active ? 0.95 : 0.38,
            scale: active ? 1.12 : 1,
            transformOrigin: '50% 100%',
            duration: 0.4,
            ease: 'power2.out',
        });
        layers.forEach((layer, index) => {
            gsap.to(layer, {
                x: (index === 1 ? -1 : 1) * (active ? 32 : 18),
                y: active ? -26 - index * 5 : -8 - index * 3,
                scaleX: active ? 1.16 + index * 0.04 : 1.06 + index * 0.02,
                scaleY: active ? 1.24 + index * 0.03 : 1.08 + index * 0.02,
                rotation: (index - 1) * (active ? 4 : 2),
                opacity: active ? 0.95 : 0.7,
                duration: active ? 1.1 + index * 0.2 : 2.6 + index * 0.45,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        });
    });
    preferences.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(ambient, { opacity: active ? 0.85 : 0.38, scale: 1 });
        gsap.set(layers, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 0.7 });
    });
    // Keep the current glow between hover states so the next pulse starts without a visual reset.
    return () => preferences.kill(false);
}
