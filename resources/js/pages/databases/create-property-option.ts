import { csrfToken } from '@/components/editor/editor-api';
import type { Property } from './types';

export type CreatedPropertyOption = { property: Property; value: unknown };

type CreatePropertyOptionRequest = {
    workspaceId: number;
    databaseId: number;
    documentId: number;
    propertyId: number;
    option: string;
    selectedOptions: string[];
};

export async function createPropertyOption({
    workspaceId,
    databaseId,
    documentId,
    propertyId,
    option,
    selectedOptions,
}: CreatePropertyOptionRequest): Promise<CreatedPropertyOption> {
    const response = await fetch(
        `/workspaces/${workspaceId}/databases/${databaseId}/documents/${documentId}/properties/${propertyId}/options`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                Accept: 'application/json',
            },
            body: JSON.stringify({ option, selected_options: selectedOptions }),
        },
    );
    if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as {
            message?: string;
        } | null;
        throw new Error(failure?.message ?? 'Could not create this option.');
    }
    return (await response.json()) as CreatedPropertyOption;
}
