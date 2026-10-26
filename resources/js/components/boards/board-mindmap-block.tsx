import { MindMapBlock } from '@/components/mindmap/mindmap-block';
import type { BoardContentProps } from './board-text-block';
export function BoardMindMapBlock(props: BoardContentProps) {
    if (!props.object.data.mindmap)
        return <p role="alert">Mind Map data unavailable.</p>;
    return (
        <MindMapBlock
            data={props.object.data.mindmap}
            editable={!props.readOnly}
            editingRequested={props.editing}
            onFinishEditing={props.onFinish}
            onComposition={props.onComposition}
            onStartEditing={props.readOnly ? undefined : props.onStartEditing}
            onChange={(mindmap, typing) =>
                props.onChange({ mindmap }, typing ? 'typing' : 'action')
            }
        />
    );
}
