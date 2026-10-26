import { layoutMindMap } from './mindmap-layout';
import type { MindMapLayoutId } from './mindmap-templates';
import type { MindMapData } from './mindmap-data';

const sampleTopics: MindMapData['topics'] = [
    {
        id: 'root',
        parent_id: null,
        text: 'Topic',
        collapsed: false,
        width: 120,
    },
    {
        id: 'a',
        parent_id: 'root',
        text: 'Branch',
        collapsed: false,
        width: 100,
    },
    {
        id: 'b',
        parent_id: 'root',
        text: 'Branch',
        collapsed: false,
        width: 100,
    },
    { id: 'c', parent_id: 'a', text: 'Detail', collapsed: false, width: 100 },
    { id: 'd', parent_id: 'b', text: 'Detail', collapsed: false, width: 100 },
];
const previews = new Map<MindMapLayoutId, ReturnType<typeof layoutMindMap>>();
function prepareTemplatePreview(layout: MindMapLayoutId) {
    let result = previews.get(layout);
    if (!result) {
        result = layoutMindMap(
            { version: 5, layout, root_id: 'root', topics: sampleTopics },
            new Map(sampleTopics.map((topic) => [topic.id, 36])),
        );
        previews.set(layout, result);
    }
    return result;
}
export function MindMapTemplatePreview({
    layout,
}: {
    layout: MindMapLayoutId;
}) {
    const preview = prepareTemplatePreview(layout);
    return (
        <svg
            viewBox={`0 0 ${preview.width} ${preview.height}`}
            aria-hidden="true"
            className="mindmap-template-preview"
        >
            <g transform={`translate(${preview.offsetX} ${preview.offsetY})`}>
                {preview.paths.map((path, index) => (
                    <path
                        key={index}
                        d={path}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                    />
                ))}
            </g>
            {preview.topics.map((topic) => (
                <rect
                    key={topic.topic.id}
                    x={topic.x}
                    y={topic.y}
                    width={topic.width}
                    height={topic.height}
                    rx={7}
                    fill={
                        topic.depth === 0 ? 'var(--foreground)' : 'var(--muted)'
                    }
                    stroke="currentColor"
                    strokeWidth={2}
                />
            ))}
        </svg>
    );
}
