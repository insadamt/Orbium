import { Type, ChevronDown } from 'lucide-react';
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
                <button
                    type="button"
                    className="board-tool-button"
                    aria-label="Text style"
                    disabled={disabled}
                >
                    <Type size={16} aria-hidden="true" />
                    {boardBlockLabels[object.block_type]}
                    <ChevronDown size={12} aria-hidden="true" />
                </button>
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
                <Menu.Separator />
                <Menu.Sub>
                    <Menu.SubTrigger>Alignment</Menu.SubTrigger>
                    <Menu.SubContent>
                        <Menu.RadioGroup
                            value={object.data.align ?? 'left'}
                            onValueChange={(value) =>
                                onChange({
                                    ...object,
                                    data: {
                                        ...object.data,
                                        align: value as
                                            | 'left'
                                            | 'center'
                                            | 'right',
                                    },
                                })
                            }
                        >
                            <Menu.RadioItem value="left" disabled={disabled}>
                                Left
                            </Menu.RadioItem>
                            <Menu.RadioItem value="center" disabled={disabled}>
                                Center
                            </Menu.RadioItem>
                            <Menu.RadioItem value="right" disabled={disabled}>
                                Right
                            </Menu.RadioItem>
                        </Menu.RadioGroup>
                    </Menu.SubContent>
                </Menu.Sub>
                <Menu.Sub>
                    <Menu.SubTrigger>Text direction</Menu.SubTrigger>
                    <Menu.SubContent>
                        <Menu.RadioGroup
                            value={object.data.dir ?? 'auto'}
                            onValueChange={(value) =>
                                onChange({
                                    ...object,
                                    data: {
                                        ...object.data,
                                        dir: value as 'auto' | 'ltr' | 'rtl',
                                    },
                                })
                            }
                        >
                            <Menu.RadioItem value="auto" disabled={disabled}>
                                Automatic
                            </Menu.RadioItem>
                            <Menu.RadioItem value="ltr" disabled={disabled}>
                                Left to right
                            </Menu.RadioItem>
                            <Menu.RadioItem value="rtl" disabled={disabled}>
                                Right to left
                            </Menu.RadioItem>
                        </Menu.RadioGroup>
                    </Menu.SubContent>
                </Menu.Sub>
            </Menu.Content>
        </Menu.Root>
    );
}
