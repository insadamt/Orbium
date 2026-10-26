import type { BoardTool } from './board-types';

export function BoardBrushPreview({
    tool,
    color,
}: {
    tool: Extract<BoardTool, 'pen' | 'path' | 'highlighter' | 'eraser'>;
    color: string;
}) {
    return (
        <svg
            className="board-brush-preview"
            viewBox="0 0 88 32"
            fill="none"
            aria-hidden="true"
        >
            {tool === 'path' ? (
                <>
                    <path
                        d="M-4 8H46L55 12V20L46 24H-4Z"
                        fill="currentColor"
                        opacity=".12"
                    />
                    <path
                        d="M-4 8H46L55 12V20L46 24H-4M46 8V24"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path
                        d="M55 12L68 8L81 16L68 24L55 20Z"
                        fill={color}
                        fillOpacity=".2"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path
                        d="M65 16H81"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <circle
                        cx="65"
                        cy="16"
                        r="2"
                        fill={color}
                        stroke="currentColor"
                        strokeWidth="1"
                    />
                    <path d="M0 12H39" stroke="currentColor" opacity=".3" />
                </>
            ) : tool === 'pen' ? (
                <>
                    <path
                        d="M-4 8H55L72 16L55 24H-4Z"
                        fill="currentColor"
                        opacity=".12"
                    />
                    <path
                        d="M-4 10H54L68 16L54 22H-4"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path
                        d="M54 10V22M59 12L57 16L59 20"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path d="M68 14L79 16L68 18Z" fill={color} />
                    <path d="M0 13H46" stroke="currentColor" opacity=".3" />
                </>
            ) : tool === 'highlighter' ? (
                <>
                    <path
                        d="M-4 7H49L61 12V23H-4Z"
                        fill="currentColor"
                        opacity=".12"
                    />
                    <path
                        d="M-4 7H49L61 12V23H-4M49 7V23"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path
                        d="M61 12H72L79 19V23H61Z"
                        fill={color}
                        opacity=".65"
                    />
                    <path
                        d="M72 12L79 19V23H61V12Z"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path d="M0 11H43" stroke="currentColor" opacity=".3" />
                </>
            ) : (
                <>
                    <rect
                        x="4"
                        y="7"
                        width="65"
                        height="18"
                        rx="5"
                        fill="currentColor"
                        opacity=".12"
                    />
                    <rect
                        x="4"
                        y="7"
                        width="65"
                        height="18"
                        rx="5"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path
                        d="M46 7V25M50 11H61M50 15H61M50 19H61"
                        stroke="currentColor"
                        opacity=".35"
                    />
                </>
            )}
        </svg>
    );
}
