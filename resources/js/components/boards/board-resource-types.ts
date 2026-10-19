import type { EditorDocument } from '@/components/editor/editor-api';
import type { MarkdownLimits } from '@/components/editor/markdown/markdown-api';
export type BoardResource = {
    id: number;
    parent_id: number | null;
    parent_title?: string | null;
    type: 'document' | 'database' | 'board';
    title: string;
    icon: string | null;
    icon_url: string | null;
    excerpt: string;
    revision: number | null;
    url: string;
};
export type ResourceDocument = {
    id: number;
    title: string;
    parent_id: number | null;
    revision: number;
} & (
    | {
          content_format_version: 2;
          markdown: string;
          markdown_limits: MarkdownLimits;
      }
    | { content_format_version: 1; content: EditorDocument }
);
export type ResourceLocation = {
    workspaceId: number;
    boardId: number;
    targetId: number;
    tabId: string;
};
