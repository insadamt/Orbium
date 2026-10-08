import { markdownLanguage } from '@codemirror/lang-markdown';
import type { MarkdownParser } from '@lezer/markdown';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';

export const markdownSourceParser = (
    markdownLanguage.parser as MarkdownParser
).configure(orbiumMarkdownDialect);
