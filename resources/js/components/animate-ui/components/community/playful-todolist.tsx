'use client';

import * as React from 'react';
import { motion, type Transition } from 'motion/react';
import { Label } from '@/components/ui/label';
import {
    Checkbox,
    CheckboxIndicator,
} from '@/components/animate-ui/primitives/radix/checkbox';
import { playfulTaskPath } from './playful-task-path';

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

const getPathAnimate = (isChecked: boolean) => ({
    pathLength: isChecked ? 1 : 0,
    opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
    pathLength: { duration: 1, ease: 'easeInOut' },
    opacity: {
        duration: 0.01,
        delay: isChecked ? 0 : 1,
    },
});

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
                        >
                            <CheckboxIndicator className="size-3" />
                        </Checkbox>
                        <div className="relative inline-block">
                            <Label htmlFor={`checkbox-${item.id}`}>
                                {item.label}
                            </Label>
                            <motion.svg
                                width="340"
                                height="32"
                                viewBox="0 0 340 32"
                                className="pointer-events-none absolute top-1/2 left-0 z-20 h-10 w-full -translate-y-1/2"
                            >
                                <motion.path
                                    d={playfulTaskPath}
                                    vectorEffect="non-scaling-stroke"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeMiterlimit={10}
                                    fill="none"
                                    initial={false}
                                    animate={getPathAnimate(!!checked[idx])}
                                    transition={getPathTransition(
                                        !!checked[idx],
                                    )}
                                    className="stroke-neutral-900 dark:stroke-neutral-100"
                                />
                            </motion.svg>
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
