// Summary: Identifies required first-line text markers so visible selection and focus cannot consume a block's saved type; depends only on the explicit V3 type and body content.
import type { V3BlockType } from '../structure/v3-contract';

export function v3TextPrefixLength(type: V3BlockType, content: string) {
    const prefix = /^heading-[1-6]$/.test(type)
        ? /^ {0,3}#{1,6}(?:[ \t]+|$)/
        : /^(bullet-list|numbered-list|checklist)$/.test(type)
          ? /^[ \t]*(?:[-+*]|\d+[.)])(?:[ \t]+|$)(?:\[[ xX]\][ \t]*)?/
          : type === 'callout'
            ? /^ {0,3}>[ \t]*\[![A-Za-z][A-Za-z0-9_-]*\][+-]?(?:[ \t]+|$)/
            : type === 'quote'
              ? /^ {0,3}>[ \t]?/
              : null;
    return prefix?.exec(content)?.[0].length ?? 0;
}
