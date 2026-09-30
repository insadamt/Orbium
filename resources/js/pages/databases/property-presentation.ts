import {
    AlignLeft,
    AtSign,
    CalendarDays,
    CheckSquare,
    CircleDot,
    Hash,
    Link2,
    ListFilter,
    Paperclip,
    Text,
} from 'lucide-react';
import type { PropertyType } from './types';

export const propertyTypes = {
    text: {
        label: 'Text',
        icon: AlignLeft,
        description: 'Notes and short text',
    },
    number: {
        label: 'Number',
        icon: Hash,
        description: 'Amounts and quantities',
    },
    select: {
        label: 'Select',
        icon: CircleDot,
        description: 'Choose one option',
    },
    multi_select: {
        label: 'Multi-select',
        icon: ListFilter,
        description: 'Choose multiple options',
    },
    checkbox: {
        label: 'Checkbox',
        icon: CheckSquare,
        description: 'A simple yes or no',
    },
    date: {
        label: 'Date',
        icon: CalendarDays,
        description: 'Dates and deadlines',
    },
    url: { label: 'URL', icon: Link2, description: 'A link to a website' },
    email: { label: 'Email', icon: AtSign, description: 'An email address' },
    files: {
        label: 'Files',
        icon: Paperclip,
        description: 'Files and attachments',
    },
    mention: {
        label: 'Mention',
        icon: AtSign,
        description: 'References to your content',
    },
} satisfies Record<
    PropertyType,
    { label: string; icon: typeof Text; description: string }
>;

export function selectedValues(value: unknown): (string | number)[] {
    return Array.isArray(value)
        ? value.filter(
              (item): item is string | number =>
                  typeof item === 'string' || typeof item === 'number',
          )
        : [];
}
