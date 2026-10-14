import { Pin, PinOff } from 'lucide-react';
import { PositionedMenu } from '@/components/ui/positioned-menu';
import * as Menu from '@/components/ui/dropdown-menu';

export type TabMenuPosition = {
    tabId: string;
    title: string;
    pinned: boolean;
    x: number;
    y: number;
    direction: 'ltr' | 'rtl';
};

export function NavigationTabContextMenu({
    position,
    onClose,
    onTogglePin,
}: {
    position: TabMenuPosition | null;
    onClose: () => void;
    onTogglePin: (tabId: string, pinned: boolean) => void;
}) {
    if (!position) return null;
    const Icon = position.pinned ? PinOff : Pin;
    return (
        <PositionedMenu
            position={position}
            label={`Actions for ${position.title} tab`}
            onClose={onClose}
            returnFocusTo={document.getElementById(`tab-${position.tabId}`)}
        >
            <Menu.Item
                onSelect={() => {
                    onTogglePin(position.tabId, !position.pinned);
                    onClose();
                }}
            >
                <Icon size={16} /> {position.pinned ? 'Unpin tab' : 'Pin tab'}
            </Menu.Item>
        </PositionedMenu>
    );
}
