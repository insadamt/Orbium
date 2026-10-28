import type { FormattingRun, TextMarks } from './markdown-formatting-runs';
import { escapeUnbalancedSpanBrackets } from './markdown-span-source';

const markOrder = [
    'bold',
    'italic',
    'strike',
    'href',
    'metadata',
    'code',
] as const;

export type SerializedFormatting = {
    source: string;
    positions: Map<number, number>;
};

export function serializeFormattingRuns(
    runs: FormattingRun[],
    requestedPositions: number[],
): SerializedFormatting {
    const positions = new Map<number, number>();
    let source = '';
    const append = (text: string) => {
        source += text;
    };
    function render(group: FormattingRun[], depth: number) {
        if (depth === markOrder.length) {
            for (const run of group) {
                const start = source.length;
                const text = serializedRunText(run, run.source);
                append(text);
                for (const position of [
                    run.from,
                    run.to,
                    ...requestedPositions,
                ]) {
                    if (position >= run.from && position <= run.to)
                        positions.set(
                            position,
                            start +
                                (position === run.to
                                    ? text.length
                                    : serializedRunText(
                                          run,
                                          run.source.slice(
                                              0,
                                              position - run.from,
                                          ),
                                      ).length),
                        );
                }
            }
            return;
        }
        let start = 0;
        while (start < group.length) {
            const value = markValue(group[start], markOrder[depth]);
            let end = start + 1;
            while (
                end < group.length &&
                markValue(group[end], markOrder[depth]) === value &&
                !group[end - 1].protected &&
                !group[end].protected
            )
                end++;
            const parts = group.slice(start, end);
            if (!value) render(parts, depth + 1);
            else {
                const leading = parts[0].source.match(/^\s+/)?.[0] ?? '';
                const trailing = parts.at(-1)!.source.match(/\s+$/)?.[0] ?? '';
                const trimmed = parts.map((part) => ({ ...part }));
                if (leading) {
                    render(
                        [
                            {
                                ...trimmed[0],
                                source: leading,
                                to: trimmed[0].from + leading.length,
                            },
                        ],
                        markOrder.length,
                    );
                    trimmed[0].from += leading.length;
                    trimmed[0].source = trimmed[0].source.slice(leading.length);
                }
                if (
                    trailing &&
                    trimmed.at(-1)!.source.length >= trailing.length
                ) {
                    trimmed.at(-1)!.to -= trailing.length;
                    trimmed.at(-1)!.source = trimmed
                        .at(-1)!
                        .source.slice(0, -trailing.length);
                }
                const contents = trimmed.filter((part) => part.source.length);
                if (contents.length) {
                    const wrapper = markWrapper(
                        markOrder[depth],
                        value,
                        contents,
                    );
                    append(wrapper.opening);
                    render(contents, depth + 1);
                    append(wrapper.closing);
                }
                if (
                    trailing &&
                    (parts.length > 1 ||
                        parts[0].source.length > leading.length)
                )
                    render(
                        [
                            {
                                ...parts.at(-1)!,
                                from: parts.at(-1)!.to - trailing.length,
                                source: trailing,
                            },
                        ],
                        markOrder.length,
                    );
            }
            start = end;
        }
    }
    render(runs, 0);
    return { source, positions };
}

function markValue(
    run: FormattingRun,
    mark: (typeof markOrder)[number],
): string {
    if (run.protected && !run.icon) return '';
    if (run.icon && (mark === 'metadata' || mark === 'code')) return '';
    if (mark === 'metadata')
        return run.marks.color || run.marks.underline
            ? JSON.stringify({
                  ...(run.marks.color ? { color: run.marks.color } : {}),
                  ...(run.marks.underline ? { underline: true } : {}),
              })
            : '';
    if (mark === 'href')
        return run.marks.href
            ? JSON.stringify({
                  href: run.marks.href,
                  title: run.marks.linkTitle,
              })
            : '';
    return String(run.marks[mark as keyof TextMarks] || '');
}

function markWrapper(
    mark: (typeof markOrder)[number],
    value: string,
    runs: FormattingRun[],
) {
    if (mark === 'metadata') {
        return { opening: ':orbium[', closing: ']' + value };
    }
    if (mark === 'href') {
        const link = JSON.parse(value) as { href: string; title?: string };
        return {
            opening: '[',
            closing: `](<${link.href}>${link.title ? ' ' + link.title : ''})`,
        };
    }
    let delimiter =
        mark === 'bold'
            ? '**'
            : mark === 'italic'
              ? '*'
              : mark === 'strike'
                ? '~~'
                : '`';
    const codeContents =
        mark === 'code'
            ? runs.map((run) => serializedRunText(run, run.source)).join('')
            : '';
    if (mark === 'code') {
        let fenceLength = 1;
        for (const match of codeContents.matchAll(/`+/g))
            fenceLength = Math.max(fenceLength, match[0].length + 1);
        delimiter = '`'.repeat(fenceLength);
    }
    const padding =
        mark === 'code' &&
        (codeContents.startsWith('`') || codeContents.endsWith('`'))
            ? ' '
            : '';
    return { opening: delimiter + padding, closing: padding + delimiter };
}

function decodeInlineSource(source: string) {
    const escaped = source.replace(
        /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,
        '$1',
    );
    if (!/&(?:#\d+|#x[\da-f]+|[a-z]+);/i.test(escaped)) return escaped;
    const decoder = document.createElement('textarea');
    decoder.innerHTML = escaped;
    return decoder.value;
}

function serializedRunText(run: FormattingRun, source: string): string {
    if (run.icon && source === run.source) {
        const metadata = { ...run.icon.metadata };
        if (run.marks.color) metadata.color = run.marks.color;
        else delete metadata.color;
        if (run.marks.underline) metadata.underline = true;
        else delete metadata.underline;
        return run.icon.prefix + JSON.stringify(metadata);
    }
    if (run.protected) return source;
    if (run.marks.code)
        return run.literal ? source : decodeInlineSource(source);
    if (run.literal)
        return source
            .replace(/&/g, '&amp;')
            .replace(/([\\`*_[\]<>~])/g, '\\$1');
    if (run.marks.color || run.marks.underline || run.marks.href)
        return escapeUnbalancedSpanBrackets(source);
    return source;
}
