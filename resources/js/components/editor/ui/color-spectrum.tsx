import { useEffect, useState, type PointerEvent } from 'react';
import {
    hexToSpectrum,
    resolveColorHex,
    spectrumToHex,
    type SpectrumColor,
} from './color-spectrum-values';

export function ColorSpectrum({
    currentColor,
    onChoose,
}: {
    currentColor?: string;
    onChoose: (hex: string) => void;
}) {
    const [color, setColor] = useState(() =>
        hexToSpectrum(resolveColorHex(currentColor)),
    );
    const hex = spectrumToHex(color);
    const [hexDraft, setHexDraft] = useState(hex);
    useEffect(() => {
        const next = resolveColorHex(currentColor);
        setColor(hexToSpectrum(next));
        setHexDraft(next);
    }, [currentColor]);

    function preview(next: SpectrumColor) {
        setColor(next);
        setHexDraft(spectrumToHex(next));
    }
    function choose(next: SpectrumColor) {
        preview(next);
        onChoose(spectrumToHex(next));
    }
    function colorAtPointer(event: PointerEvent<HTMLDivElement>) {
        const bounds = event.currentTarget.getBoundingClientRect();
        return {
            ...color,
            saturation: Math.min(
                1,
                Math.max(0, (event.clientX - bounds.left) / bounds.width),
            ),
            brightness:
                1 -
                Math.min(
                    1,
                    Math.max(0, (event.clientY - bounds.top) / bounds.height),
                ),
        };
    }
    function commitHex() {
        const normalized = hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`;
        if (/^#[0-9a-f]{6}$/i.test(normalized)) {
            if (normalized.toLowerCase() !== hex.toLowerCase())
                choose(hexToSpectrum(normalized));
        } else setHexDraft(hex);
    }
    return (
        <div className="editor-color-spectrum">
            <div
                role="slider"
                tabIndex={0}
                aria-label="Color saturation and brightness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(color.saturation * 100)}
                aria-valuetext={`${Math.round(color.saturation * 100)}% saturation, ${Math.round(color.brightness * 100)}% brightness`}
                className="editor-color-spectrum-plane"
                style={{ backgroundColor: `hsl(${color.hue} 100% 50%)` }}
                onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.focus({ preventScroll: true });
                    event.currentTarget.setPointerCapture(event.pointerId);
                    preview(colorAtPointer(event));
                }}
                onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                        preview(colorAtPointer(event));
                }}
                onPointerCancel={() =>
                    preview(hexToSpectrum(resolveColorHex(currentColor)))
                }
                onPointerUp={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId))
                        return;
                    event.currentTarget.releasePointerCapture(event.pointerId);
                    choose(colorAtPointer(event));
                    event.currentTarget.focus({ preventScroll: true });
                }}
                onKeyDown={(event) => {
                    if (
                        ![
                            'ArrowLeft',
                            'ArrowRight',
                            'ArrowUp',
                            'ArrowDown',
                        ].includes(event.key)
                    )
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    const step = event.shiftKey ? 0.1 : 0.01;
                    choose({
                        ...color,
                        saturation: Math.max(
                            0,
                            Math.min(
                                1,
                                color.saturation +
                                    (event.key === 'ArrowLeft'
                                        ? -step
                                        : event.key === 'ArrowRight'
                                          ? step
                                          : 0),
                            ),
                        ),
                        brightness: Math.max(
                            0,
                            Math.min(
                                1,
                                color.brightness +
                                    (event.key === 'ArrowDown'
                                        ? -step
                                        : event.key === 'ArrowUp'
                                          ? step
                                          : 0),
                            ),
                        ),
                    });
                    event.currentTarget.focus({ preventScroll: true });
                }}
            >
                <span
                    className="editor-color-spectrum-thumb"
                    aria-hidden="true"
                    style={{
                        left: `${color.saturation * 100}%`,
                        top: `${(1 - color.brightness) * 100}%`,
                        backgroundColor: hex,
                    }}
                />
            </div>
            <input
                type="range"
                min={0}
                max={359}
                value={Math.round(color.hue)}
                aria-label="Color hue"
                className="editor-color-hue"
                onKeyDown={(event) => event.stopPropagation()}
                onChange={(event) =>
                    choose({ ...color, hue: event.currentTarget.valueAsNumber })
                }
            />
            <label className="editor-color-hex-field">
                <span
                    className="editor-color-hex-preview"
                    aria-hidden="true"
                    style={{ backgroundColor: hex }}
                />
                <span className="editor-color-hex-label">HEX</span>
                <input
                    aria-label="Hex color"
                    type="text"
                    value={hexDraft.toUpperCase()}
                    maxLength={7}
                    spellCheck={false}
                    onChange={(event) => setHexDraft(event.target.value)}
                    onBlur={commitHex}
                    onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            commitHex();
                        }
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            setHexDraft(hex);
                        }
                    }}
                />
            </label>
        </div>
    );
}
