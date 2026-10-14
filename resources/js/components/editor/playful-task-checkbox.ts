import { gsap } from 'gsap';
import { playfulTaskPath } from '@/components/animate-ui/components/community/playful-task-path';

export function mountPlayfulTaskCheckbox(input: HTMLInputElement) {
    const host = input.ownerDocument.createElement('span');
    host.className = 'orbium-task-checkbox';
    host.contentEditable = 'false';
    input.replaceWith(host);
    host.append(input);
    const tick = createTaskSvg('0 0 24 24', 'M4.5 12.75l6 6 9-13.5');
    tick.classList.add('orbium-task-tick');
    host.append(tick);
    const window = input.ownerDocument.defaultView!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const waves: SVGSVGElement[] = [];
    let previousChecked = input.checked;
    let frame = 0;
    let observedLine: HTMLElement | null = null;
    let animateNextUpdate = false;
    let destroyed = false;
    let waveGeometry = '';

    const resizeObserver = new ResizeObserver(() => scheduleUpdate());
    const mutationObserver = new MutationObserver((records) => {
        if (records.some((record) => !host.contains(record.target)))
            scheduleUpdate();
    });

    function createTaskSvg(viewBox: string, pathData: string) {
        const svg = input.ownerDocument.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
        );
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('preserveAspectRatio', 'none');
        const path = input.ownerDocument.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
        );
        path.setAttribute('d', pathData);
        path.setAttribute('pathLength', '1');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.append(path);
        return svg;
    }

    function removeWaves() {
        for (const wave of waves) {
            gsap.killTweensOf(wave.firstElementChild);
            wave.remove();
        }
        waves.length = 0;
    }

    function drawTaskWaves(animate: boolean) {
        const line =
            host.closest<HTMLElement>('.cm-line') ?? host.closest('li');
        if (!line || !host.isConnected) return;
        if (line !== observedLine) {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            resizeObserver.observe(line);
            mutationObserver.observe(line, {
                childList: true,
                characterData: true,
                subtree: true,
            });
            observedLine = line;
        }
        if (!input.checked) {
            removeWaves();
            waveGeometry = '';
            return;
        }
        const range = input.ownerDocument.createRange();
        const content = line.querySelector(':scope > div > p');
        if (content) range.selectNodeContents(content);
        else {
            range.selectNodeContents(host.parentElement!);
            range.setStartAfter(host);
        }
        const origin = host.getBoundingClientRect();
        const rows: {
            left: number;
            right: number;
            top: number;
            height: number;
        }[] = [];
        for (const rect of range.getClientRects()) {
            if (rect.width < 1 || rect.height < 1) continue;
            const row = rows.find((item) => Math.abs(item.top - rect.top) < 3);
            if (row) {
                row.left = Math.min(row.left, rect.left);
                row.right = Math.max(row.right, rect.right);
                row.height = Math.max(row.height, rect.height);
            } else
                rows.push({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    height: rect.height,
                });
        }
        const geometry = JSON.stringify(
            rows.map((row) => [
                row.left - origin.left,
                row.right - origin.left,
                row.top - origin.top,
                row.height,
            ]),
        );
        if (geometry === waveGeometry && !animate && !reducedMotion.matches)
            return;
        waveGeometry = geometry;
        removeWaves();
        for (const rect of rows) {
            const wave = createTaskSvg('0 0 340 32', playfulTaskPath);
            wave.classList.add('orbium-task-wave');
            Object.assign(wave.style, {
                left: `${rect.left - origin.left}px`,
                top: `${rect.top - origin.top + rect.height / 2 - 8}px`,
                width: `${rect.right - rect.left}px`,
                height: '16px',
            });
            host.append(wave);
            waves.push(wave);
            if (animate && !reducedMotion.matches)
                gsap.fromTo(
                    wave.firstElementChild,
                    { strokeDashoffset: 1 },
                    {
                        strokeDashoffset: 0,
                        duration: 1,
                        ease: 'power1.inOut',
                    },
                );
        }
    }

    function scheduleUpdate(animate = false) {
        if (destroyed) return;
        animateNextUpdate ||= animate;
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
            drawTaskWaves(animateNextUpdate);
            animateNextUpdate = false;
        });
    }

    function update() {
        const changed = input.checked !== previousChecked;
        host.dataset.checked = String(input.checked);
        host.dataset.disabled = String(input.disabled);
        const path = tick.firstElementChild;
        gsap.killTweensOf(path);
        gsap.to(path, {
            strokeDashoffset: input.checked ? 0 : 1,
            opacity: input.checked ? 1 : 0,
            duration: changed && !reducedMotion.matches ? 0.2 : 0,
        });
        previousChecked = input.checked;
        scheduleUpdate(changed);
    }

    input.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    update();
    return {
        host,
        update,
        destroy() {
            destroyed = true;
            window.cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            input.removeEventListener('change', update);
            reducedMotion.removeEventListener('change', update);
            gsap.killTweensOf(tick.firstElementChild);
            removeWaves();
        },
    };
}
