import { horizontalTree, verticalTree } from './mindmap-tree-layouts';
import {
    arrangementBounds,
    horizontalConnection,
    verticalConnection,
    placedTopic,
    topicPath,
    type LayoutPath,
    visibleChildren,
    type LayoutContext,
    type PlacedTopic,
    type TopicArrangement,
} from './mindmap-layout-types';

function appendTreeConnections(
    topics: PlacedTopic[],
    paths: LayoutPath[],
    vertical: boolean,
    direction: number,
) {
    const positions = new Map(topics.map((topic) => [topic.topic.id, topic]));
    for (const child of topics) {
        const parent = child.topic.parent_id
            ? positions.get(child.topic.parent_id)
            : undefined;
        if (parent)
            paths.push(
                topicPath(
                    child.topic.id,
                    vertical
                        ? verticalConnection(parent, child, direction)
                        : horizontalConnection(parent, child),
                ),
            );
    }
}
export function timelineLayout(
    context: LayoutContext,
    vertical = false,
): TopicArrangement {
    const rootSize = context.sizes.get(context.root.id)!;
    const root = placedTopic(context, context.root, {
        x: vertical ? -rootSize.width / 2 : 0,
        y: vertical ? 0 : -rootSize.height / 2 - rootSize.iconSpace / 2,
        depth: 0,
        direction: vertical ? 'down' : 'right',
    });
    const topics = [root];
    const paths: LayoutPath[] = [];
    let position = (vertical ? root.y + root.height : root.width) + 80;
    let spineEnd = vertical ? root.y + root.height : root.width;
    visibleChildren(context, context.root).forEach((branch, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const branchContext = { ...context, root: branch };
        const group = vertical
            ? horizontalTree(branchContext, direction < 0 ? 'left' : 'right')
            : verticalTree(branchContext, direction);
        const bounds = arrangementBounds(group.topics);
        const offsetX = vertical
            ? direction > 0
                ? 64 - bounds.left
                : -64 - bounds.right
            : position - bounds.left;
        const offsetY = vertical
            ? position - bounds.top
            : direction > 0
              ? 64 - bounds.top
              : -64 - bounds.bottom;
        for (const topic of group.topics) {
            topic.x += offsetX;
            topic.y += offsetY;
            topic.depth += 1;
        }
        const station = group.topics[0];
        if (vertical) {
            spineEnd = station.y + station.height / 2;
            paths.push(
                topicPath(
                    station.topic.id,
                    `M0,${spineEnd} H${station.x + (direction < 0 ? station.width : 0)}`,
                ),
            );
            position += bounds.bottom - bounds.top + 64;
        } else {
            spineEnd = station.x + station.width / 2;
            paths.push(
                topicPath(
                    station.topic.id,
                    `M${spineEnd},0 V${station.y + (direction < 0 ? station.height : 0)}`,
                ),
            );
            position += bounds.right - bounds.left + 64;
        }
        appendTreeConnections(group.topics, paths, !vertical, direction);
        topics.push(...group.topics);
    });
    if (topics.length > 1)
        paths.unshift(
            topicPath(
                root.topic.id,
                vertical
                    ? `M0,${root.y + root.height} V${spineEnd}`
                    : `M${root.width},0 H${spineEnd}`,
            ),
        );
    return { topics, paths };
}

export function fishboneLayout(context: LayoutContext): TopicArrangement {
    const branches = visibleChildren(context, context.root);
    const groups = branches.map((branch) =>
        horizontalTree({ ...context, root: branch }, 'left'),
    );
    const topics: PlacedTopic[] = [];
    const paths: LayoutPath[] = [];
    let left = 0;
    //
    // Reserve a full subtree column for each pair of causes so variable-width, multiline branches cannot overlap.
    //
    for (let index = 0; index < groups.length; index += 2) {
        const pair = groups.slice(index, index + 2);
        const bounds = pair.map((group) => arrangementBounds(group.topics));
        const columnWidth = Math.max(
            ...bounds.map((box) => box.right - box.left),
        );
        pair.forEach((group, side) => {
            const box = bounds[side];
            const offsetX = left + columnWidth - box.right;
            const offsetY = side === 0 ? -64 - box.bottom : 64 - box.top;
            for (const topic of group.topics) {
                topic.x += offsetX;
                topic.y += offsetY;
                topic.depth += 1;
            }
            const cause = group.topics[0];
            paths.push(
                topicPath(
                    cause.topic.id,
                    `M${left + columnWidth + 48},0 L${cause.x + cause.width},${cause.y + cause.height / 2}`,
                ),
            );
            appendTreeConnections(group.topics, paths, false, -1);
            topics.push(...group.topics);
        });
        left += columnWidth + 96;
    }
    const root = placedTopic(context, context.root, {
        x: left,
        y:
            -(
                context.sizes.get(context.root.id)!.height +
                context.sizes.get(context.root.id)!.iconSpace
            ) / 2,
        depth: 0,
        direction: 'left',
    });
    if (branches.length) {
        paths.unshift(topicPath(root.topic.id, `M0,0 H${root.x}`));
        paths.push(
            topicPath(
                root.topic.id,
                `M${root.x - 9},-5 L${root.x},0 L${root.x - 9},5`,
            ),
        );
    }
    return { topics: [root, ...topics], paths };
}
