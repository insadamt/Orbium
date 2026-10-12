import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus } from 'lucide-react';
import type { CreatedPropertyOption } from './create-property-option';

type Props = {
    option: string;
    selectedOptions: (string | number)[];
    busy: boolean;
    onCreate: (
        option: string,
        selectedOptions: string[],
    ) => Promise<CreatedPropertyOption>;
    onCreated: (result: CreatedPropertyOption) => void;
    onBusyChange: (busy: boolean) => void;
    onError: (message: string) => void;
};

export default function CreatePropertyOptionItem({
    option,
    selectedOptions,
    busy,
    onCreate,
    onCreated,
    onBusyChange,
    onError,
}: Props) {
    async function createOption() {
        if (busy) return;
        onBusyChange(true);
        onError('');
        try {
            const result = await onCreate(
                option,
                selectedOptions.filter(
                    (item): item is string => typeof item === 'string',
                ),
            );
            onCreated(result);
        } catch (failure) {
            onError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not create this option.',
            );
        } finally {
            onBusyChange(false);
        }
    }

    return (
        <DropdownMenu.Item
            className="db-menu-item"
            disabled={busy}
            onSelect={(event) => {
                event.preventDefault();
                void createOption();
            }}
        >
            <Plus size={14} className="shrink-0" />
            <span className="truncate">Create “{option}”</span>
        </DropdownMenu.Item>
    );
}
