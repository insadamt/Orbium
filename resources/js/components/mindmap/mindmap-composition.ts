export function isMindMapComposing(host?: HTMLElement | null) {
    return Boolean(host?.querySelector('[data-mindmap-composing="true"]'));
}
