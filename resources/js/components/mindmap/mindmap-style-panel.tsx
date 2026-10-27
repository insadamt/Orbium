import { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import iconData from '@/components/inline-icons/data/icons.json';
import { MindMapTopicIcon } from './mindmap-topic-icon';
import { branchColors, type BranchColor } from './mindmap-branch-style';
import type { MindMapTopic } from './mindmap-data';

const icons = Object.entries(iconData);
export function MindMapStylePanel({
    topic,
    onChange,
    onClose,
}: {
    topic: MindMapTopic;
    onChange: (style: { color?: BranchColor; icon?: string }) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const matches = useMemo(
        () =>
            icons.filter(([name, metadata]) =>
                `${name} ${metadata.label}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase()),
            ),
        [query],
    );
    const pageCount = Math.max(1, Math.ceil(matches.length / 48));
    const currentPage = Math.min(page, pageCount - 1);
    return (
        <div
            className="mindmap-parent-panel mindmap-style-panel"
            data-mindmap-style-panel
            role="group"
            aria-label="Branch appearance"
            onKeyDown={(event) => {
                if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }
                if (event.ctrlKey || event.metaKey) event.stopPropagation();
            }}
        >
            <div className="mindmap-parent-heading">
                <span>Branch appearance</span>
                <button
                    type="button"
                    aria-label="Close branch appearance"
                    onClick={onClose}
                >
                    <X size={14} />
                </button>
            </div>
            <p>Color follows this branch unless a child has its own color.</p>
            <div
                className="mindmap-color-options"
                role="group"
                aria-label="Branch color"
            >
                <button
                    type="button"
                    aria-pressed={!topic.color}
                    onClick={() => onChange({ color: undefined })}
                >
                    Inherit
                </button>
                {Object.entries(branchColors).map(([color, value]) => (
                    <button
                        key={color}
                        type="button"
                        aria-label={`${color} branch`}
                        title={color}
                        aria-pressed={topic.color === color}
                        style={{ background: value }}
                        onClick={() =>
                            onChange({ color: color as BranchColor })
                        }
                    />
                ))}
            </div>
            <div className="mindmap-icon-current">
                <span>
                    <MindMapTopicIcon name={topic.icon} /> Topic icon
                </span>
                <button
                    type="button"
                    disabled={!topic.icon}
                    onClick={() => onChange({ icon: undefined })}
                >
                    Remove
                </button>
            </div>
            <label className="mindmap-icon-search">
                <Search size={14} />
                <input
                    aria-label="Search branch icons"
                    placeholder="Search icons and brands…"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setPage(0);
                    }}
                />
            </label>
            <div
                className="mindmap-icon-options"
                role="group"
                aria-label="Branch icons"
            >
                {matches
                    .slice(currentPage * 48, (currentPage + 1) * 48)
                    .map(([name, metadata]) => (
                        <button
                            key={name}
                            type="button"
                            title={metadata.label}
                            aria-label={metadata.label}
                            aria-pressed={topic.icon === name}
                            onClick={() => onChange({ icon: name })}
                        >
                            <MindMapTopicIcon name={name} />
                        </button>
                    ))}
                {!matches.length && <p>No matching icons</p>}
            </div>
            <div className="mindmap-icon-pages">
                <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                >
                    Previous
                </button>
                <span aria-live="polite">
                    {currentPage + 1} / {pageCount}
                </span>
                <button
                    type="button"
                    disabled={currentPage + 1 >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
