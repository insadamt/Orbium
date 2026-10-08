export function escapeUnbalancedSpanBrackets(source: string) {
    const unmatched: number[] = [];
    const escaped = new Set<number>();
    let codeLength = 0;
    for (let position = 0; position < source.length; position++) {
        if (source[position] === '\\') {
            position++;
            continue;
        }
        if (source[position] === '`') {
            let end = position;
            while (source[end] === '`') end++;
            const length = end - position;
            if (!codeLength) codeLength = length;
            else if (length === codeLength) codeLength = 0;
            position = end - 1;
            continue;
        }
        if (codeLength) continue;
        if (source[position] === '[') unmatched.push(position);
        else if (source[position] === ']') {
            if (unmatched.length) unmatched.pop();
            else escaped.add(position);
        }
    }
    for (const position of unmatched) escaped.add(position);
    return source
        .split('')
        .map((character, index) =>
            escaped.has(index) ? `\\${character}` : character,
        )
        .join('');
}
