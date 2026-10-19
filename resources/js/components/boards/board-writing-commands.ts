import type {
    BoardBlockData,
    BoardBlockReplacement,
    BoardInline,
} from './board-types';
import { createBoardBlockData } from './board-block-data';

export const boardWritingCommands = [
    { id: 'text', title: 'Text', kind: 'text' },
    { id: 'heading1', title: 'Heading 1', kind: 'heading', level: 1 },
    { id: 'heading2', title: 'Heading 2', kind: 'heading', level: 2 },
    { id: 'heading3', title: 'Heading 3', kind: 'heading', level: 3 },
    { id: 'bullet', title: 'Bullet list', kind: 'list', listStyle: 'bullet' },
    {
        id: 'ordered',
        title: 'Numbered list',
        kind: 'list',
        listStyle: 'ordered',
    },
    { id: 'check', title: 'Checklist', kind: 'list', listStyle: 'check' },
    { id: 'quote', title: 'Quote', kind: 'quote' },
    { id: 'callout', title: 'Callout', kind: 'callout' },
] as const;
export type BoardWritingCommand = (typeof boardWritingCommands)[number];

export function createWritingReplacement(
    command: BoardWritingCommand,
    content: BoardInline[],
    original: BoardBlockData,
): BoardBlockReplacement {
    const data = createBoardBlockData(command.kind);
    if (command.kind === 'list') {
        data.list_style = command.listStyle;
        data.items = [{ content, checked: false, indent: 0 }];
    } else data.content = content;
    if (command.kind === 'heading') data.level = command.level;
    for (const key of ['align', 'dir', 'legacy_source'] as const) {
        if (original[key] !== undefined)
            Object.assign(data, { [key]: original[key] });
    }
    return { kind: command.kind, data };
}

export function markdownWritingCommand(marker: string) {
    const shortcuts: Record<string, string> = {
        '#': 'heading1',
        '##': 'heading2',
        '###': 'heading3',
        '-': 'bullet',
        '*': 'bullet',
        '+': 'bullet',
        '1.': 'ordered',
        '[]': 'check',
        '[ ]': 'check',
        '>': 'quote',
    };
    return boardWritingCommands.find(
        (command) => command.id === shortcuts[marker],
    );
}
