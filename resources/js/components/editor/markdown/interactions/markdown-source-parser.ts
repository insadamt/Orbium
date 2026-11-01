// Summary: Parses external Markdown and scoped V3 bodies for non-editor readers; depends on the existing body dialect and explicit V3 tree wrapper.
import { v3MarkdownDialect } from '../runtime/v3-markdown-dialect';
import { markdownLanguage } from '@codemirror/lang-markdown';
import type { MarkdownParser } from '@lezer/markdown';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';

export const markdownBodyParser = (
    markdownLanguage.parser as MarkdownParser
).configure(orbiumMarkdownDialect);
export const markdownSourceParser =
    markdownBodyParser.configure(v3MarkdownDialect);
