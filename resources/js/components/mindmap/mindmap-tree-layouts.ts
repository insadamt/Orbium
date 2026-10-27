import type { MindMapTopic } from './mindmap-data';
import {
    placedTopic,
    topicPath,
    type LayoutPath,
    visibleChildren,
    horizontalConnection,
    verticalConnection,
    type LayoutContext,
    type PlacedTopic,
    type TopicArrangement,
} from './mindmap-layout-types';

export function horizontalTree(
    context: LayoutContext,
    mode: 'balanced' | 'left' | 'right' = 'right',
): TopicArrangement {
    const spans = new Map<string, number>();
    function measure(topic: MindMapTopic): number {
        const span = Math.max(
            context.sizes.get(topic.id)!.height + 24,
            visibleChildren(context, topic).reduce(
                (sum, child) => sum + measure(child),
                0,
            ),
        );
        spans.set(topic.id, span);
        return span;
    }
    measure(context.root);
    const branches = visibleChildren(context, context.root);
    const sides =
        mode === 'balanced'
            ? [
                  branches.filter((_, i) => i % 2 === 0),
                  branches.filter((_, i) => i % 2 === 1),
              ]
            : mode === 'left'
              ? [[], branches]
              : [branches, []];
    const groupSpan = (group: MindMapTopic[]) =>
        group.reduce((sum, topic) => sum + spans.get(topic.id)!, 0);
    const height = Math.max(
        context.sizes.get(context.root.id)!.height + 24,
        ...sides.map(groupSpan),
    );
    const root = placedTopic(context, context.root, {
        x: 0,
        y: height / 2 - context.sizes.get(context.root.id)!.height / 2,
        depth: 0,
        direction: mode === 'left' ? 'left' : 'right',
    });
    const topics = [root];
    const paths: LayoutPath[] = [];
    function place(
        group: MindMapTopic[],
        direction: number,
        depth: number,
        start: number,
        parent: PlacedTopic,
    ) {
        let top = start;
        for (const topic of group) {
            const span = spans.get(topic.id)!;
            const size = context.sizes.get(topic.id)!;
            const current = placedTopic(context, topic, {
                x:
                    direction > 0
                        ? parent.x + parent.width + 60
                        : parent.x - size.width - 60,
                y: top + span / 2 - size.height / 2,
                depth,
                direction: direction > 0 ? 'right' : 'left',
            });
            topics.push(current);
            paths.push(
                topicPath(
                    current.topic.id,
                    horizontalConnection(parent, current),
                ),
            );
            const descendants = visibleChildren(context, topic);
            place(
                descendants,
                direction,
                depth + 1,
                top + (span - groupSpan(descendants)) / 2,
                current,
            );
            top += span;
        }
    }
    sides.forEach((group, index) =>
        place(
            group,
            index === 0 ? 1 : -1,
            1,
            (height - groupSpan(group)) / 2,
            root,
        ),
    );
    return { topics, paths };
}

export function verticalTree(
    context: LayoutContext,
    direction = 1,
): TopicArrangement {
    const spans = new Map<string, number>();
    const levelHeights: number[] = [];
    function measure(topic: MindMapTopic, depth: number): number {
        levelHeights[depth] = Math.max(
            levelHeights[depth] ?? 0,
            context.sizes.get(topic.id)!.height,
        );
        const children = visibleChildren(context, topic);
        const span = Math.max(
            context.sizes.get(topic.id)!.width,
            children.reduce(
                (sum, child) => sum + measure(child, depth + 1),
                0,
            ) +
                Math.max(0, children.length - 1) * 32,
        );
        spans.set(topic.id, span);
        return span;
    }
    measure(context.root, 0);
    const levelPositions = [0];
    levelHeights.forEach(
        (height, depth) =>
            (levelPositions[depth + 1] = levelPositions[depth] + height + 64),
    );
    const topics: PlacedTopic[] = [];
    const paths: LayoutPath[] = [];
    function place(
        topic: MindMapTopic,
        depth: number,
        left: number,
        parent?: PlacedTopic,
    ) {
        const size = context.sizes.get(topic.id)!;
        const current = placedTopic(context, topic, {
            x: left + (spans.get(topic.id)! - size.width) / 2,
            y:
                direction > 0
                    ? levelPositions[depth]
                    : -levelPositions[depth] - size.height,
            depth,
            direction: direction > 0 ? 'down' : 'up',
        });
        topics.push(current);
        if (parent)
            paths.push(
                topicPath(
                    current.topic.id,
                    verticalConnection(parent, current, direction),
                ),
            );
        const children = visibleChildren(context, topic);
        const childrenWidth =
            children.reduce((sum, child) => sum + spans.get(child.id)!, 0) +
            Math.max(0, children.length - 1) * 32;
        let childLeft = left + (spans.get(topic.id)! - childrenWidth) / 2;
        for (const child of children) {
            place(child, depth + 1, childLeft, current);
            childLeft += spans.get(child.id)! + 32;
        }
    }
    place(context.root, 0, 0);
    return { topics, paths };
}

export function outlineTree(context: LayoutContext): TopicArrangement {
    const topics: PlacedTopic[] = [];
    const paths: LayoutPath[] = [];
    let top = 0;
    function place(topic: MindMapTopic, depth: number, parent?: PlacedTopic) {
        const current = placedTopic(context, topic, {
            x: depth * 36,
            y: top,
            depth,
            direction: 'right',
        });
        topics.push(current);
        if (parent)
            paths.push(
                topicPath(
                    current.topic.id,
                    `M${parent.x + 12},${parent.y + parent.height} V${current.y + current.height / 2} H${current.x}`,
                ),
            );
        top += context.sizes.get(topic.id)!.height + 18;
        visibleChildren(context, topic).forEach((child) =>
            place(child, depth + 1, current),
        );
    }
    place(context.root, 0);
    return { topics, paths };
}

export function braceTree(context: LayoutContext): TopicArrangement {
    const arrangement = horizontalTree(context);
    const positions = new Map(
        arrangement.topics.map((topic) => [topic.topic.id, topic]),
    );
    const paths: LayoutPath[] = [];
    for (const parent of arrangement.topics) {
        const children = visibleChildren(context, parent.topic).map((child) =>
            positions.get(child.id)!,
        );
        if (!children.length) continue;
        const start = children[0].y + children[0].height / 2;
        const end = children.at(-1)!.y + children.at(-1)!.height / 2;
        const top = children.length === 1 ? start - 18 : start;
        const bottom = children.length === 1 ? end + 18 : end;
        const middle = (top + bottom) / 2;
        const x = parent.x + parent.width + 24;
        paths.push(
            topicPath(
                parent.topic.id,
                `M${parent.x + parent.width},${parent.y + parent.height / 2} L${x},${middle}`,
            ),
        );
        paths.push(
            topicPath(
                parent.topic.id,
                `M${x + 16},${top} Q${x + 6},${top} ${x + 6},${top + 12} L${x + 6},${middle - 10} Q${x + 6},${middle} ${x},${middle} Q${x + 6},${middle} ${x + 6},${middle + 10} L${x + 6},${bottom - 12} Q${x + 6},${bottom} ${x + 16},${bottom}`,
            ),
        );
        children.forEach((child) =>
            paths.push(
                topicPath(
                    child.topic.id,
                    `M${x + 16},${child.y + child.height / 2} H${child.x}`,
                ),
            ),
        );
    }
    return { topics: arrangement.topics, paths };
}
