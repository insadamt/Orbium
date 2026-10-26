import { mindMapTopicWidth } from './mindmap-topic-width';
import type { MindMapData, MindMapTopic } from './mindmap-data';
import {
    arrangementBounds,
    type LayoutContext,
    type TopicArrangement,
} from './mindmap-layout-types';
import {
    horizontalTree,
    verticalTree,
    outlineTree,
    braceTree,
} from './mindmap-tree-layouts';
import { fishboneLayout, timelineLayout } from './mindmap-spine-layouts';
export type { PlacedTopic } from './mindmap-layout-types';
export const topicWidth = mindMapTopicWidth.default;
export const topicHeight = 56;

function estimateTopicHeight(topic: MindMapTopic) {
    const charactersPerLine = Math.max(
        1,
        Math.floor(((topic.width ?? topicWidth) - 28) / 8),
    );
    return Math.max(
        topicHeight,
        topic.text
            .split('\n')
            .reduce(
                (lines, line) =>
                    lines +
                    Math.max(
                        1,
                        Math.ceil(Array.from(line).length / charactersPerLine),
                    ),
                0,
            ) *
            20 +
            16,
    );
}
export function layoutMindMap(
    map: MindMapData,
    measuredHeights: ReadonlyMap<string, number> = new Map(),
) {
    const children = new Map<string, MindMapTopic[]>();
    for (const topic of map.topics) {
        if (topic.parent_id !== null) {
            const siblings = children.get(topic.parent_id) ?? [];
            siblings.push(topic);
            children.set(topic.parent_id, siblings);
        }
    }
    const context: LayoutContext = {
        root: map.topics.find((topic) => topic.id === map.root_id)!,
        children,
        sizes: new Map(
            map.topics.map((topic) => [
                topic.id,
                {
                    width: topic.width ?? topicWidth,
                    height:
                        measuredHeights.get(topic.id) ??
                        estimateTopicHeight(topic),
                },
            ]),
        ),
    };
    let arrangement: TopicArrangement;
    switch (map.layout) {
        case 'tree-right':
            arrangement = horizontalTree(context);
            break;
        case 'tree-left':
            arrangement = horizontalTree(context, 'left');
            break;
        case 'hierarchy-down':
            arrangement = verticalTree(context);
            break;
        case 'hierarchy-up':
            arrangement = verticalTree(context, -1);
            break;
        case 'outline':
            arrangement = outlineTree(context);
            break;
        case 'brace':
            arrangement = braceTree(context);
            break;
        case 'fishbone':
            arrangement = fishboneLayout(context);
            break;
        case 'timeline':
            arrangement = timelineLayout(context);
            break;
        case 'timeline-vertical':
            arrangement = timelineLayout(context, true);
            break;
        default:
            arrangement = horizontalTree(context, 'balanced');
    }
    const bounds = arrangementBounds(arrangement.topics);
    const offsetX = 32 - bounds.left;
    const offsetY = 24 - bounds.top;
    //
    // Keep connector geometry in layout coordinates while normalizing topic bounds for scrolling and Fit.
    //
    arrangement.topics.forEach((topic) => {
        topic.x += offsetX;
        topic.y += offsetY;
    });
    return {
        ...arrangement,
        offsetX,
        offsetY,
        width: bounds.right - bounds.left + 64,
        height: bounds.bottom - bounds.top + 48,
    };
}
