import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Pilcrow,
    PilcrowLeft,
    PilcrowRight,
    ChevronDown,
} from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import { BoardToolButton } from './board-tool-button';
import type { BoardBlockData } from './board-types';

export function BoardTextLayoutControls({
    data,
    disabled,
    onChange,
}: {
    data: BoardBlockData;
    disabled: boolean;
    onChange: (data: BoardBlockData) => void;
}) {
    //
    // Layout belongs to the whole Board block, so changing it must preserve the existing inline content and marks.
    //
    const alignment = data.align ?? 'left';
    const direction = data.dir ?? 'auto';
    return (
        <div
            className="board-toolbar-group"
            role="group"
            aria-label="Text layout"
        >
            <Menu.Root modal={false}>
                <Menu.Trigger asChild>
                    <BoardToolButton
                        label="Text alignment"
                        icon={
                            alignment === 'center'
                                ? AlignCenter
                                : alignment === 'right'
                                  ? AlignRight
                                  : AlignLeft
                        }
                        disabled={disabled}
                    >
                        <ChevronDown size={12} aria-hidden="true" />
                    </BoardToolButton>
                </Menu.Trigger>
                <Menu.Content side="bottom" align="start" collisionPadding={12}>
                    <Menu.Label>Text alignment</Menu.Label>
                    <Menu.RadioGroup
                        value={alignment}
                        onValueChange={(value) =>
                            onChange({
                                ...data,
                                align: value as BoardBlockData['align'],
                            })
                        }
                    >
                        <Menu.RadioItem value="left" disabled={disabled}>
                            <AlignLeft /> Left
                        </Menu.RadioItem>
                        <Menu.RadioItem value="center" disabled={disabled}>
                            <AlignCenter /> Center
                        </Menu.RadioItem>
                        <Menu.RadioItem value="right" disabled={disabled}>
                            <AlignRight /> Right
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Root>
            <Menu.Root modal={false}>
                <Menu.Trigger asChild>
                    <BoardToolButton
                        label="Text direction"
                        icon={
                            direction === 'ltr'
                                ? PilcrowRight
                                : direction === 'rtl'
                                  ? PilcrowLeft
                                  : Pilcrow
                        }
                        disabled={disabled}
                    >
                        <ChevronDown size={12} aria-hidden="true" />
                    </BoardToolButton>
                </Menu.Trigger>
                <Menu.Content side="bottom" align="start" collisionPadding={12}>
                    <Menu.Label>Text direction</Menu.Label>
                    <Menu.RadioGroup
                        value={direction}
                        onValueChange={(value) =>
                            onChange({
                                ...data,
                                dir: value as BoardBlockData['dir'],
                            })
                        }
                    >
                        <Menu.RadioItem value="auto" disabled={disabled}>
                            <Pilcrow /> Automatic
                        </Menu.RadioItem>
                        <Menu.RadioItem value="ltr" disabled={disabled}>
                            <PilcrowRight /> Left to right
                        </Menu.RadioItem>
                        <Menu.RadioItem value="rtl" disabled={disabled}>
                            <PilcrowLeft /> Right to left
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Root>
        </div>
    );
}
