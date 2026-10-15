import { useLayoutEffect, useRef } from 'react';

type Props = {
    value: string;
    label: string;
    placeholder: string;
    className?: string;
    onChange: (value: string) => void;
    onSave: () => void;
};

function resizeTitleField(field: HTMLTextAreaElement) {
    field.style.height = '0px';
    field.style.height = `${field.scrollHeight}px`;
}

export function PageTitleField({
    value,
    label,
    placeholder,
    className,
    onChange,
    onSave,
}: Props) {
    const fieldRef = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        if (fieldRef.current) resizeTitleField(fieldRef.current);
    }, [value]);
    useLayoutEffect(() => {
        const field = fieldRef.current;
        if (!field) return;
        let previousWidth = -1;
        const observer = new ResizeObserver(() => {
            const width = field.getBoundingClientRect().width;
            if (width === previousWidth) return;
            previousWidth = width;
            if (width) resizeTitleField(field);
        });
        observer.observe(field);
        return () => observer.disconnect();
    }, []);

    return (
        <textarea
            ref={fieldRef}
            aria-label={label}
            value={value}
            placeholder={placeholder}
            rows={1}
            maxLength={255}
            className={`page-title-field ${className ?? ''}`}
            onChange={(event) =>
                onChange(event.target.value.replace(/[\r\n]+/g, ' '))
            }
            onBlur={onSave}
            onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                event.currentTarget.blur();
            }}
        />
    );
}
