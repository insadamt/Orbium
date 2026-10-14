export function mountPlayfulTaskCheckbox(input: HTMLInputElement) {
    const host = input.ownerDocument.createElement('span');
    host.className = 'orbium-task-checkbox orbium-animated-checkbox';
    host.contentEditable = 'false';
    input.replaceWith(host);
    host.append(input);
    const tick = input.ownerDocument.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
    );
    tick.classList.add('orbium-checkbox-indicator');
    tick.setAttribute('viewBox', '0 0 24 24');
    tick.setAttribute('aria-hidden', 'true');
    const path = input.ownerDocument.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
    );
    path.setAttribute('d', 'M4.5 12.75l6 6 9-13.5');
    tick.append(path);
    host.append(tick);
    return host;
}
