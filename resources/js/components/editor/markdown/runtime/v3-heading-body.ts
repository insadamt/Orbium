// Summary: Keeps an identified heading's internal lines in one styled heading without rewriting source; depends on the body parser, inline prose grammar and presentation directive tree offsets.
import { Tree, type SyntaxNode } from '@lezer/common';
import type { MarkdownParser } from '@lezer/markdown';
import { readOrbiumMetadata } from '../dialect/metadata';

export function parseV3HeadingBody(
    source: string,
    level: number,
    parser: MarkdownParser,
    proseParser: MarkdownParser,
): Tree {
    const original = parser.parse(source);
    const first = original.topNode.firstChild;
    if (!first) return original;
    if (first.name === 'OrbiumDirective') {
        const header = first.getChild('OrbiumHeader');
        const body = first.getChild('Document');
        const metadata =
            header &&
            readOrbiumMetadata(
                source
                    .slice(header.from, header.to)
                    .replace(/^:{3,}orbium /, '')
                    .trimEnd(),
            );
        if (!body || metadata?.kind !== 'block') return original;
        const nested = parseV3HeadingBody(
            source.slice(body.from, body.to),
            level,
            parser,
            proseParser,
        );
        const children: Tree[] = [];
        const positions: number[] = [];
        for (let child = first.firstChild; child; child = child.nextSibling) {
            children.push(
                child === body || child.name === 'Document'
                    ? nested
                    : child.toTree(),
            );
            positions.push(child.from - first.from);
        }
        const replacement = new Tree(
            first.type,
            children,
            positions,
            first.to - first.from,
        );
        const roots: Tree[] = [];
        const offsets: number[] = [];
        for (
            let node = original.topNode.firstChild;
            node;
            node = node.nextSibling
        ) {
            roots.push(node.from === first.from ? replacement : node.toTree());
            offsets.push(node.from);
        }
        return new Tree(original.type, roots, offsets, source.length);
    }
    if (!new RegExp(`^(?:ATX|Setext)Heading${level}$`).test(first.name))
        return original;
    const end = source.length - (/\n*$/.exec(source)?.[0].length ?? 0);
    const marks = first.getChildren('HeaderMark');
    const children: { tree: Tree; from: number }[] = marks.map((mark) => ({
        tree: mark.toTree(),
        from: mark.from - first.from,
    }));
    const prose = proseParser.parse(source.slice(first.from, end));
    const appendInline = (node: SyntaxNode) => {
        for (let child = node.firstChild; child; child = child.nextSibling)
            if (
                !marks.some(
                    (mark) =>
                        child!.from + first.from < mark.to &&
                        child!.to + first.from > mark.from,
                )
            )
                children.push({ tree: child.toTree(), from: child.from });
    };
    for (let node = prose.topNode.firstChild; node; node = node.nextSibling) {
        if (node.name === 'Paragraph') appendInline(node);
        else children.push({ tree: node.toTree(), from: node.from });
    }
    children.sort((a, b) => a.from - b.from);
    return new Tree(
        original.type,
        [
            new Tree(
                first.type,
                children.map((entry) => entry.tree),
                children.map((entry) => entry.from),
                end - first.from,
            ),
        ],
        [first.from],
        source.length,
    );
}
