import * as React from 'react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { Slot } from '@radix-ui/react-slot';
import { motion, type HTMLMotionProps } from 'motion/react';
const MotionSlot = motion.create(Slot);

type DropdownMenuItemProps = React.ComponentProps<
    typeof DropdownMenuPrimitive.Item
> &
    HTMLMotionProps<'div'>;

function DropdownMenuItem({
    asChild,
    disabled,
    onSelect,
    textValue,
    ...props
}: DropdownMenuItemProps) {
    const ItemElement = asChild ? MotionSlot : motion.div;

    return (
        <DropdownMenuPrimitive.Item
            disabled={disabled}
            onSelect={onSelect}
            textValue={textValue}
            asChild
        >
            <ItemElement
                data-slot="dropdown-menu-item"
                data-disabled={disabled || undefined}
                {...props}
            />
        </DropdownMenuPrimitive.Item>
    );
}

type DropdownMenuCheckboxItemProps = Omit<
    React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>,
    'asChild'
> &
    HTMLMotionProps<'div'>;

function DropdownMenuCheckboxItem({
    checked,
    onCheckedChange,
    disabled,
    onSelect,
    textValue,
    ...props
}: DropdownMenuCheckboxItemProps) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            onSelect={onSelect}
            textValue={textValue}
            asChild
        >
            <motion.div
                data-slot="dropdown-menu-checkbox-item"
                data-disabled={disabled || undefined}
                {...props}
            />
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

type DropdownMenuRadioItemProps = Omit<
    React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>,
    'asChild'
> &
    HTMLMotionProps<'div'>;

function DropdownMenuRadioItem({
    value,
    disabled,
    onSelect,
    textValue,
    ...props
}: DropdownMenuRadioItemProps) {
    return (
        <DropdownMenuPrimitive.RadioItem
            value={value}
            disabled={disabled}
            onSelect={onSelect}
            textValue={textValue}
            asChild
        >
            <motion.div
                data-slot="dropdown-menu-radio-item"
                data-disabled={disabled || undefined}
                {...props}
            />
        </DropdownMenuPrimitive.RadioItem>
    );
}

export {
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    type DropdownMenuItemProps,
    type DropdownMenuCheckboxItemProps,
    type DropdownMenuRadioItemProps,
};
