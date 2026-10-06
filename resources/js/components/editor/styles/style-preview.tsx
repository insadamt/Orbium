import { Fragment } from 'react';
import { blockStyleTypes, type BlockStyleType } from './block-style-types';

function blockSample(type: BlockStyleType) {
    switch (type) {
        case 'heading-1':
            return (
                <h1 className="orbium-heading-1">Your knowledge, your style</h1>
            );
        case 'heading-2':
            return <h2 className="orbium-heading-2">A place for ideas</h2>;
        case 'heading-3':
            return <h3 className="orbium-heading-3">Small details matter</h3>;
        case 'paragraph':
            return (
                <>
                    <p className="orbium-paragraph">
                        A paragraph with <strong>bold text</strong>,{' '}
                        <em>emphasis</em>, and <code>inline code</code>.
                    </p>
                    <p className="orbium-paragraph" dir="rtl">
                        هذه فقرة عربية لمعاينة اتجاه النص.
                    </p>
                </>
            );
        case 'bullet-list':
            return (
                <ul className="orbium-bullet-list">
                    <li>
                        <p className="orbium-paragraph">Collect an idea</p>
                    </li>
                    <li>
                        <p className="orbium-paragraph">
                            Connect it to your work
                        </p>
                    </li>
                </ul>
            );
        case 'ordered-list':
            return (
                <ol className="orbium-ordered-list">
                    <li>
                        <p className="orbium-paragraph">Write</p>
                    </li>
                    <li>
                        <p className="orbium-paragraph">Review</p>
                    </li>
                </ol>
            );
        case 'checklist':
            return (
                <ul className="orbium-checklist" data-type="taskList">
                    <li data-type="taskItem">
                        <label>
                            <input
                                type="checkbox"
                                checked
                                readOnly
                                aria-label="Completed example task"
                            />
                        </label>
                        <div>
                            <p className="orbium-paragraph">Ready to explore</p>
                        </div>
                    </li>
                </ul>
            );
        case 'quote':
            return (
                <blockquote className="orbium-quote">
                    <p className="orbium-paragraph">
                        Good notes make room for clear thinking.
                    </p>
                </blockquote>
            );
        case 'callout':
            return (
                <aside
                    className="orbium-callout editor-callout"
                    data-callout=""
                >
                    <p className="orbium-paragraph">
                        A callout brings attention to a useful detail.
                    </p>
                </aside>
            );
        case 'code':
            return (
                <div className="orbium-code my-5 overflow-hidden rounded-xl border border-border bg-muted">
                    <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                        JAVASCRIPT · Copy
                    </div>
                    <pre className="!m-0 !rounded-none !border-0">
                        <code>{'const idea = "Make something useful";'}</code>
                    </pre>
                </div>
            );
        case 'table':
            return (
                <div className="tableWrapper">
                    <table className="orbium-table">
                        <tbody>
                            <tr>
                                <th>
                                    <p className="orbium-paragraph">Idea</p>
                                </th>
                                <th>
                                    <p className="orbium-paragraph">Status</p>
                                </th>
                            </tr>
                            <tr>
                                <td>
                                    <p className="orbium-paragraph">
                                        Editor theme
                                    </p>
                                </td>
                                <td>
                                    <p className="orbium-paragraph">Draft</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        case 'image':
            return (
                <div className="orbium-image editor-image my-5">
                    <svg
                        viewBox="0 0 360 120"
                        className="w-full rounded-lg"
                        role="img"
                        aria-label="Example landscape"
                    >
                        <rect
                            width="360"
                            height="120"
                            fill="currentColor"
                            opacity="0.08"
                        />
                        <path
                            d="M0 120L90 30L170 95L230 40L360 120Z"
                            fill="currentColor"
                            opacity="0.25"
                        />
                    </svg>
                    <p className="orbium-paragraph text-sm">
                        A quiet landscape
                    </p>
                </div>
            );
        case 'file':
            return (
                <div className="orbium-file my-4 rounded-xl border border-border p-4">
                    <span className="font-medium underline">
                        project-notes.pdf
                    </span>
                    <span className="ms-3 text-xs text-muted-foreground">
                        24 KB
                    </span>
                </div>
            );
        case 'mermaid':
            return (
                <div className="orbium-mermaid my-4 rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">
                        Diagram · Preview
                    </p>
                    <svg
                        viewBox="0 0 300 70"
                        role="img"
                        aria-label="Example diagram: Idea to Action"
                    >
                        <rect
                            x="5"
                            y="10"
                            width="90"
                            height="45"
                            rx="8"
                            fill="none"
                            stroke="currentColor"
                        />
                        <text
                            x="50"
                            y="38"
                            textAnchor="middle"
                            fill="currentColor"
                        >
                            Idea
                        </text>
                        <path
                            d="M100 32H190m-10-6 10 6-10 6"
                            fill="none"
                            stroke="currentColor"
                        />
                        <rect
                            x="200"
                            y="10"
                            width="95"
                            height="45"
                            rx="8"
                            fill="none"
                            stroke="currentColor"
                        />
                        <text
                            x="247"
                            y="38"
                            textAnchor="middle"
                            fill="currentColor"
                        >
                            Action
                        </text>
                    </svg>
                </div>
            );
        case 'math':
            return (
                <div className="orbium-math my-4 rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">
                        Equation · Preview
                    </p>
                    <div className="py-2 text-center font-serif text-xl">
                        E = mc²
                    </div>
                </div>
            );
        case 'divider':
            return <hr className="orbium-divider" />;
    }
}

export default function StylePreview({
    css,
    selected,
}: {
    css: string;
    selected?: BlockStyleType;
}) {
    const types = selected
        ? [selected]
        : ([
              'heading-1',
              'paragraph',
              ...blockStyleTypes
                  .map(([type]) => type)
                  .filter(
                      (type) => type !== 'heading-1' && type !== 'paragraph',
                  ),
          ] as BlockStyleType[]);
    return (
        <section
            aria-label="Document style preview"
            data-style-preview
            className="editor-style-sample"
        >
            <style>{css}</style>
            <div className="orbium-editor">
                {types.map((type) => (
                    <Fragment key={type}>{blockSample(type)}</Fragment>
                ))}
            </div>
        </section>
    );
}
