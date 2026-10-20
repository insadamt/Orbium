import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowUp,
    Copy,
    Files,
    Trash2,
    Type,
    Languages,
} from 'lucide-react';
import { PositionedMenu } from '@/components/ui/positioned-menu';
import * as Menu from '@/components/ui/dropdown-menu';

export const blockConversions = [
    'Text',
    'Heading 1',
    'Heading 2',
    'Heading 3',
    'Bullet list',
    'Numbered list',
    'Checklist',
    'Quote',
    'Code',
];
export type BlockMenuAction = 'up' | 'down' | 'duplicate' | 'copy' | 'delete';
export type BlockMenuAnchor = {
    x: number;
    y: number;
    direction: 'ltr' | 'rtl';
};
type Props = {
    currentBlockType?: string;
    conversionTargets: readonly string[];
    anchor: BlockMenuAnchor;
    formatting: {
        alignment: string | null;
        direction: string;
        canAlign: boolean;
    };
    canMoveUp: boolean;
    canMoveDown: boolean;
    onClose: () => void;
    onFocusEditor: () => void;
    onConvert: (label: string) => void;
    onAlignment: (alignment: 'left' | 'center' | 'right') => void;
    onDirection: (direction: 'auto' | 'ltr' | 'rtl') => void;
    onAction: (action: BlockMenuAction) => void;
};

export function BlockMenuSurface({
    currentBlockType,
    conversionTargets,
    anchor,
    formatting,
    canMoveUp,
    canMoveDown,
    onClose,
    onFocusEditor,
    onConvert,
    onAlignment,
    onDirection,
    onAction,
}: Props) {
    function perform(action: () => void) {
        action();
        onClose();
    }
    return (
        <PositionedMenu
            position={anchor}
            label="Block options"
            onClose={onClose}
            blockContextMenu
            onRestoreFocus={onFocusEditor}
        >
            {conversionTargets.length > 0 && (
                <Menu.Sub>
                    <Menu.SubTrigger>
                        <Type size={16} /> {currentBlockType ?? 'Turn into…'}
                    </Menu.SubTrigger>
                    <Menu.SubContent
                        className="block-context-select-content"
                        data-block-context-menu
                    >
                        <Menu.Label>Turn into</Menu.Label>
                        {conversionTargets.map((label) => (
                            <Menu.Item
                                key={label}
                                onSelect={() => perform(() => onConvert(label))}
                            >
                                {label}
                            </Menu.Item>
                        ))}
                    </Menu.SubContent>
                </Menu.Sub>
            )}
            <Menu.Sub>
                <Menu.SubTrigger disabled={!formatting.canAlign}>
                    <AlignLeft size={16} /> Text alignment
                </Menu.SubTrigger>
                <Menu.SubContent data-block-context-menu>
                    <Menu.RadioGroup
                        value={formatting.alignment ?? 'left'}
                        onValueChange={(value) =>
                            perform(() =>
                                onAlignment(
                                    value as 'left' | 'center' | 'right',
                                ),
                            )
                        }
                    >
                        <Menu.RadioItem value="left">
                            <AlignLeft size={16} /> Left
                        </Menu.RadioItem>
                        <Menu.RadioItem value="center">
                            <AlignCenter size={16} /> Center
                        </Menu.RadioItem>
                        <Menu.RadioItem value="right">
                            <AlignRight size={16} /> Right
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.SubContent>
            </Menu.Sub>
            <Menu.Sub>
                <Menu.SubTrigger>
                    <Languages size={16} /> Text direction
                </Menu.SubTrigger>
                <Menu.SubContent data-block-context-menu>
                    <Menu.RadioGroup
                        value={formatting.direction}
                        onValueChange={(value) =>
                            perform(() =>
                                onDirection(value as 'auto' | 'ltr' | 'rtl'),
                            )
                        }
                    >
                        <Menu.RadioItem value="auto">Auto</Menu.RadioItem>
                        <Menu.RadioItem value="ltr">
                            Left to right
                        </Menu.RadioItem>
                        <Menu.RadioItem value="rtl">
                            Right to left
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.SubContent>
            </Menu.Sub>
            <Menu.Separator />
            <Menu.Item
                disabled={!canMoveUp}
                onSelect={() => perform(() => onAction('up'))}
            >
                <ArrowUp size={16} /> Move up
            </Menu.Item>
            <Menu.Item
                disabled={!canMoveDown}
                onSelect={() => perform(() => onAction('down'))}
            >
                <ArrowDown size={16} /> Move down
            </Menu.Item>
            <Menu.Item onSelect={() => perform(() => onAction('duplicate'))}>
                <Files size={16} /> Duplicate
            </Menu.Item>
            <Menu.Item onSelect={() => perform(() => onAction('copy'))}>
                <Copy size={16} /> Copy text
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
                variant="destructive"
                onSelect={() => perform(() => onAction('delete'))}
            >
                <Trash2 size={16} /> Delete block
            </Menu.Item>
        </PositionedMenu>
    );
}
