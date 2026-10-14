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
                    <select
                        className="mt-1 block w-full rounded-lg border bg-background p-2"
                        value={value.paper}
                        onChange={(event) =>
                            onChange({
                                ...value,
                                paper: event.target
                                    .value as PageOptions['paper'],
                            })
                        }
                    >
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                    </select>
                </label>
                <label>
                    Orientation
                    <select
                        className="mt-1 block w-full rounded-lg border bg-background p-2"
                        value={value.orientation}
                        onChange={(event) =>
                            onChange({
                                ...value,
                                orientation: event.target
                                    .value as PageOptions['orientation'],
                            })
                        }
                    >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                    </select>
                </label>
            </div>
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
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
