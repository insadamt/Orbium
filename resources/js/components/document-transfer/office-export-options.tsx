import { NativeCheckbox } from '@/components/ui/native-checkbox';
import { AppSelect } from '@/components/ui/app-select';
import type { OfficeExportOptions } from './office-export';

type PageOptions = Omit<OfficeExportOptions, 'format'>;

export function OfficeExportPageOptions({
    value,
    onChange,
    disabled,
}: {
    value: PageOptions;
    onChange: (value: PageOptions) => void;
    disabled: boolean;
}) {
    return (
        <fieldset disabled={disabled} className="flex flex-col gap-3 text-sm">
            <legend className="mb-2">Page layout</legend>
            <div className="grid grid-cols-2 gap-3">
                <label>
                    Paper size
                    <AppSelect
                        label="Paper size"
                        disabled={disabled}
                        className="mt-1"
                        value={value.paper}
                        onValueChange={(nextValue) =>
                            onChange({
                                ...value,
                                paper: nextValue as PageOptions['paper'],
                            })
                        }
                        options={[
                            { value: 'a4', label: 'A4' },
                            { value: 'letter', label: 'Letter' },
                        ]}
                    />
                </label>
                <label>
                    Orientation
                    <AppSelect
                        label="Orientation"
                        disabled={disabled}
                        className="mt-1"
                        value={value.orientation}
                        onValueChange={(nextValue) =>
                            onChange({
                                ...value,
                                orientation:
                                    nextValue as PageOptions['orientation'],
                            })
                        }
                        options={[
                            { value: 'portrait', label: 'Portrait' },
                            { value: 'landscape', label: 'Landscape' },
                        ]}
                    />
                </label>
            </div>
            <label className="flex items-center gap-2">
                <NativeCheckbox
                    checked={value.page_numbers}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            page_numbers: event.target.checked,
                        })
                    }
                />
                Include page numbers
            </label>
        </fieldset>
    );
}
