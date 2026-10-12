const paths = {
    sortAscending: ['M12 20V4', 'm6 10 6-6 6 6'],
    sortDescending: ['M12 4v16', 'm6 14 6 6 6-6'],
    close: ['M18 6 6 18', 'm6 6 12 12'],
    rowAdd: ['M3 3h18v12H3Z', 'M3 9h18', 'M12 18v6', 'M9 21h6'],
    columnAdd: ['M3 3h12v18H3Z', 'M9 3v18', 'M18 12h6', 'M21 9v6'],
    rowDelete: ['M3 3h18v12H3Z', 'M3 9h18', 'M9 21h6'],
    columnDelete: ['M3 3h12v18H3Z', 'M9 3v18', 'M18 12h6'],
    header: ['M3 3h18v18H3Z', 'M3 9h18', 'M9 9v12', 'M3 6h18'],
    merge: ['M3 3h18v18H3Z', 'M7 12h10', 'm10 9-3 3 3 3', 'm14 9 3 3-3 3'],
    split: ['M3 3h18v18H3Z', 'M12 3v18', 'm8 9-3 3 3 3', 'm16 9 3 3-3 3'],
    more: ['M12 5h.01', 'M12 12h.01', 'M12 19h.01'],
    left: ['M21 6H3', 'M15 12H3', 'M17 18H3'],
    center: ['M21 6H3', 'M18 12H6', 'M17 18H7'],
    right: ['M21 6H3', 'M21 12H9', 'M21 18H7'],
    maximize: ['M8 3H3v5', 'M16 3h5v5', 'M21 16v5h-5', 'M3 16v5h5'],
    download: [
        'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
        'm7 10 5 5 5-5',
        'M12 15V3',
    ],
    trash: ['M3 6h18', 'M19 6v14H5V6', 'M9 6V3h6v3', 'M10 10v6', 'M14 10v6'],
    plus: ['M12 5v14', 'M5 12h14'],
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
