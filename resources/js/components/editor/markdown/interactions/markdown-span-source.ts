// Escape literal brackets in styled prose, preserving existing escapes and code spans.
export function escapeSpanTextBrackets(source: string) {
    let escaped = '';
    let codeLength = 0;
    for (let position = 0; position < source.length; position++) {
        const character = source[position];
        if (character === '\\' && position + 1 < source.length) {
            escaped += source.slice(position, position + 2);
            position++;
            continue;
        }
        if (character === '`') {
            let end = position;
            while (source[end] === '`') end++;
            const length = end - position;
            if (!codeLength) codeLength = length;
            else if (codeLength === length) codeLength = 0;
            escaped += source.slice(position, end);
            position = end - 1;
            continue;
        }
        escaped += !codeLength && (character === '[' || character === ']')
            ? '\\' + character
            : character;
    }
    return escaped;
}
