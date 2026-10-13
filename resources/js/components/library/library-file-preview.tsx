import { useState } from 'react';
import { Download, FileText, Maximize2, Minus, Plus } from 'lucide-react';
import {
    formatLibrarySize,
    isLibraryImage,
    libraryFileLabel,
    type LibraryFile,
} from './library-api';

export function LibraryFilePreview({ file }: { file: LibraryFile }) {
    const [zoom, setZoom] = useState(1);
    const [failed, setFailed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const image = isLibraryImage(file) && file.available && !failed;
    return (
        <section className="library-detail-viewer" aria-label="File preview">
            <div className="library-preview-stage" data-zoomed={zoom > 1}>
                {image ? (
                    <>
                        {!loaded && (
                            <p
                                role="status"
                                className="library-preview-loading"
                            >
                                Loading image…
                            </p>
                        )}
                        <img
                            src={file.url}
                            alt={file.name}
                            width={file.width ?? undefined}
                            height={file.height ?? undefined}
                            onLoad={() => setLoaded(true)}
                            onError={() => setFailed(true)}
                            style={
                                zoom > 1
                                    ? {
                                          width: `${zoom * 100}%`,
                                          maxWidth: 'none',
                                          maxHeight: 'none',
                                      }
                                    : undefined
                            }
                        />
                    </>
                ) : (
                    <div className="library-detail-file-art">
                        <FileText size={68} strokeWidth={1} />
                        <span>{libraryFileLabel(file)}</span>
                        <p>
                            {file.available && !failed
                                ? 'Preview is not available for this file type.'
                                : 'This file could not be opened from storage.'}
                        </p>
                        <p className="text-xs">
                            {formatLibrarySize(file.size_bytes)}
                        </p>
                        {file.available && (
                            <a
                                className="library-button"
                                href={`${file.url}?download=1`}
                            >
                                <Download size={16} />
                                Download file
                            </a>
                        )}
                    </div>
                )}
            </div>
            {image && (
                <div className="library-preview-tools">
                    <button
                        type="button"
                        className="library-icon-button"
                        aria-label="Zoom out"
                        disabled={zoom <= 1}
                        onClick={() =>
                            setZoom((value) => Math.max(1, value - 0.5))
                        }
                    >
                        <Minus size={17} />
                    </button>
                    <span>
                        {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
                    </span>
                    <button
                        type="button"
                        className="library-icon-button"
                        aria-label="Zoom in"
                        disabled={zoom >= 4}
                        onClick={() =>
                            setZoom((value) => Math.min(4, value + 0.5))
                        }
                    >
                        <Plus size={17} />
                    </button>
                    <button
                        type="button"
                        className="library-icon-button"
                        aria-label="Fit image to preview"
                        onClick={() => setZoom(1)}
                    >
                        <Maximize2 size={17} />
                    </button>
                </div>
            )}
        </section>
    );
}
