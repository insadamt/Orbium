import { createRoot } from 'react-dom/client';
import { MindMapBlock } from './mindmap-block';
import type { MindMapData } from './mindmap-data';

export function mountMindMapPreview(host: HTMLElement, data: MindMapData) {
    const root = createRoot(host);
    let destroyed = false;
    //
    // Rich widgets can mount/dispose inside another React commit; defer the nested root lifecycle.
    //
    queueMicrotask(() => {
        if (!destroyed) root.render(<MindMapBlock data={data} />);
    });
    return () => {
        destroyed = true;
        queueMicrotask(() => root.unmount());
    };
}
