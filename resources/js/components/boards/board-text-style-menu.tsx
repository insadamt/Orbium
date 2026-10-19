import { Type, ChevronDown } from 'lucide-react';
import { BoardToolButton } from './board-tool-button';
import * as Menu from '@/components/ui/dropdown-menu';
import { boardBlockLabels } from './board-block-data';
import type { BoardBlockKind, BoardObject } from './board-types';

export function BoardTextStyleMenu({
    object,
    disabled,
    onChange,
}: {
    object: BoardObject;
    disabled: boolean;
    onChange: (object: BoardObject) => void;
}) {
    function changeType(value: string) {
        const kind = value as BoardBlockKind;
        const data = { ...object.data };
        delete data.level;
        onChange({
            ...object,
            block_type: kind,
            data: {
                ...data,
                ...(kind === 'heading'
                    ? { level: object.data.level ?? 1 }
                    : {}),
            },
        });
    }
    return (
        <Menu.Root modal={false}>
            <Menu.Trigger asChild>
                <BoardToolButton
                    label="Text style"
                    icon={Type}
                    disabled={disabled}
                >
                    {boardBlockLabels[object.block_type]}
                    <ChevronDown size={12} aria-hidden="true" />
                </BoardToolButton>
            </Menu.Trigger>
            <Menu.Content
                side="bottom"
                align="start"
                sideOffset={10}
                collisionPadding={12}
                className="board-text-style-menu"
            >
                <Menu.Label>Text style</Menu.Label>
                <Menu.RadioGroup
                    value={object.block_type}
                    onValueChange={changeType}
                >
                    {(['text', 'heading', 'quote', 'callout'] as const).map(
                        (kind) => (
                            <Menu.RadioItem
                                key={kind}
                                value={kind}
                                disabled={disabled}
                            >
                                {boardBlockLabels[kind]}
                            </Menu.RadioItem>
                        ),
                    )}
                </Menu.RadioGroup>
                {object.block_type === 'heading' && (
                    <>
                        <Menu.Separator />
                        <Menu.Label>Heading size</Menu.Label>
                        <Menu.RadioGroup
                            value={String(object.data.level ?? 1)}
                            onValueChange={(value) =>
                                onChange({
                                    ...object,
                                    data: {
                                        ...object.data,
                                        level: Number(value),
                                    },
                                })
                            }
                        >
                            {['Large', 'Medium', 'Small'].map(
                                (label, index) => (
                                    <Menu.RadioItem
                                        key={label}
                                        value={String(index + 1)}
                                        disabled={disabled}
                                    >
                                        {label}
                                    </Menu.RadioItem>
                                ),
                            )}
                        </Menu.RadioGroup>
                    </>
                )}
            </Menu.Content>
        </Menu.Root>
    );
}
