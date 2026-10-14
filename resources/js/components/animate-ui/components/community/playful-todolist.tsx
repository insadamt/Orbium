'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const checkboxItems = [
    {
        id: 1,
        label: 'Code in Assembly 💾',
        defaultChecked: false,
    },
    {
        id: 2,
        label: 'Present a bug as a feature 🪲',
        defaultChecked: false,
    },
    {
        id: 3,
        label: 'Push to prod on a Friday 🚀',
        defaultChecked: false,
    },
];

function PlayfulTodolist() {
    const [checked, setChecked] = React.useState(
        checkboxItems.map((i) => !!i.defaultChecked),
    );

    return (
        <div className="space-y-6 rounded-2xl bg-neutral-100 p-6 dark:bg-neutral-900">
            {checkboxItems.map((item, idx) => (
                <div key={item.id} className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            className="flex size-4 items-center justify-center rounded border border-current"
                            checked={checked[idx]}
                            onCheckedChange={(val) => {
                                const updated = [...checked];
                                updated[idx] = val === true;
                                setChecked(updated);
                            }}
                            id={`checkbox-${item.id}`}
                        ></Checkbox>
                        <div className="relative inline-block">
                            <Label htmlFor={`checkbox-${item.id}`}>
                                {item.label}
                            </Label>
                        </div>
                    </div>
                    {idx !== checkboxItems.length - 1 && (
                        <div className="border-t border-neutral-300 dark:border-neutral-700" />
                    )}
                </div>
            ))}
        </div>
    );
}

export { PlayfulTodolist };
