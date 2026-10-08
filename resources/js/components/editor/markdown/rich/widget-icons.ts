const paths = {
    edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z'],
    preview: [
        'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z',
        'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    ],
    file: [
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
        'M14 2v6h6',
        'M8 13h8',
        'M8 17h5',
    ],
};

export function widgetIcon(name: keyof typeof paths, size = 14): SVGSVGElement {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', String(size));
    icon.setAttribute('height', String(size));
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    for (const data of paths[name]) {
        const path = document.createElementNS(icon.namespaceURI, 'path');
        path.setAttribute('d', data);
        icon.append(path);
    }
    return icon;
}
