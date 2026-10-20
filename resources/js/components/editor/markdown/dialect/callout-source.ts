export function readCalloutSource(source: string) {
    const [header, ...lines] = source.split('\n');
    const marker =
        /^\s*>\s*\[!([A-Za-z][A-Za-z0-9_-]*)\]([+-])?(?:[ \t]+(.*))?$/.exec(
            header,
        );
    if (!marker) return null;
    return {
        type: marker[1],
        folding: marker[2] ?? '',
        title: marker[3] ?? '',
        content: lines
            .map((line) => line.replace(/^\s*>[ \t]?/, ''))
            .join('\n'),
    };
}
