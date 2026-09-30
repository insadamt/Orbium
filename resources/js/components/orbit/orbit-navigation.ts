import gsap from 'gsap';
import { openLocation } from '@/components/navigation/tab-navigation';

type OrbitArrival = {
    workspaceId: number;
    centerId: number;
    x: number;
    y: number;
    at: number;
};
const arrivalKey = 'orbium.orbit.arrival';

export function consumeOrbitArrival(workspaceId: number, centerId: number) {
    const raw = sessionStorage.getItem(arrivalKey);
    sessionStorage.removeItem(arrivalKey);
    if (!raw) return null;
    try {
        const arrival = JSON.parse(raw) as OrbitArrival;
        return arrival.workspaceId === workspaceId &&
            arrival.centerId === centerId &&
            Date.now() - arrival.at < 5000
            ? arrival
            : null;
    } catch {
        return null;
    }
}

export function enterOrbitLocation(
    url: string,
    workspaceId: number,
    centerId: number,
    source: HTMLElement | null,
    reducedMotion: boolean,
) {
    const stage = source?.closest('.orbium-orbit-stage');
    const stageBounds = stage?.getBoundingClientRect();
    const sourceBounds = source?.getBoundingClientRect();
    if (stageBounds && sourceBounds) {
        sessionStorage.setItem(
            arrivalKey,
            JSON.stringify({
                workspaceId,
                centerId,
                x:
                    ((sourceBounds.left +
                        sourceBounds.width / 2 -
                        stageBounds.left) /
                        stageBounds.width) *
                    100,
                y:
                    ((sourceBounds.top +
                        sourceBounds.height / 2 -
                        stageBounds.top) /
                        stageBounds.height) *
                    100,
                at: Date.now(),
            } satisfies OrbitArrival),
        );
    }
    if (reducedMotion || !stage || !source) {
        openLocation(url);
        return;
    }
    gsap.to(source, { scale: 1.7, duration: 0.42, ease: 'power3.inOut' });
    gsap.to(
        [...stage.querySelectorAll('.orbium-child')].filter(
            (child) => child !== source,
        ),
        {
            opacity: 0,
            scale: 0.78,
            duration: 0.34,
            ease: 'power2.inOut',
            stagger: 0.015,
        },
    );
    gsap.to(stage.querySelector('.orbium-center'), {
        opacity: 0.15,
        scale: 0.65,
        duration: 0.42,
        ease: 'power3.inOut',
        onComplete: () => openLocation(url),
    });
}

export function returnToOrbitLocation(url: string, reducedMotion: boolean) {
    const system = document.querySelector('.orbium-orbit-system');
    if (reducedMotion || !system) {
        openLocation(url);
        return;
    }
    gsap.to(system.querySelectorAll('.orbium-child'), {
        opacity: 0,
        scale: 0.72,
        duration: 0.28,
        ease: 'power2.in',
    });
    gsap.to(system.querySelector('.orbium-center'), {
        opacity: 0,
        scale: 0.55,
        duration: 0.34,
        ease: 'power2.in',
        onComplete: () => openLocation(url),
    });
}
