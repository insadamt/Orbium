import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export type ResolvedDirection = 'ltr' | 'rtl';
type TextDirection = { direction: ResolvedDirection | null; hasText: boolean };

const rtlLetter =
    /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}]/u;
const letter = /\p{Letter}/u;
const textDirections = new WeakMap<ProseMirrorNode, TextDirection>();

function firstStrongDirection(text: string): ResolvedDirection | null {
    for (const character of text) {
        if (rtlLetter.test(character)) return 'rtl';
        if (letter.test(character)) return 'ltr';
    }
    return null;
}

function textDirection(node: ProseMirrorNode): TextDirection {
    const cached = textDirections.get(node);
    if (cached) return cached;
    let result: TextDirection = { direction: null, hasText: false };
    if (node.isLeaf) {
        const text = node.textContent;
        result = {
            direction: firstStrongDirection(text),
            hasText: text.length > 0,
        };
    } else {
        for (let index = 0; index < node.childCount; index++) {
            const child = textDirection(node.child(index));
            result = {
                direction: child.direction,
                hasText: result.hasText || child.hasText,
            };
            if (result.direction) break;
        }
    }
    textDirections.set(node, result);
    return result;
}

export function inferBlockDirection(
    block: ProseMirrorNode,
    precedingDirection: ResolvedDirection,
): ResolvedDirection {
    const text = textDirection(block);
    if (text.hasText) return text.direction ?? precedingDirection;
    return (
        firstStrongDirection(
            String(
                block.attrs.caption ||
                    block.attrs.alt ||
                    block.attrs.name ||
                    block.attrs.source ||
                    block.attrs.latex ||
                    '',
            ),
        ) ?? precedingDirection
    );
}
