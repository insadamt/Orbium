import { blockStyleTypes } from './block-style-types';

export default function StyleHelp() {
    return (
        <details className="editor-style-help">
            <summary>CSS reference</summary>
            <div>
                <p>
                    Base stylesheet: write complete rules. Block overrides:
                    write declarations only.
                </p>
                <pre>
                    {
                        '.orbium-quote {\n  padding: 12px;\n  background-color: var(--muted);\n}'
                    }
                </pre>
                <h4>Block selectors</h4>
                <ul>
                    {blockStyleTypes.map(([type, label]) => (
                        <li key={type}>
                            <span>{label}</span>
                            <code>.orbium-{type}</code>
                        </li>
                    ))}
                </ul>
                <h4>Appearance properties</h4>
                <p>
                    Colors, typography, spacing, borders, corner radius, and
                    box-shadow. Logical padding, margin, and borders support
                    RTL.
                </p>
                <h4>Theme colors</h4>
                <p>
                    Use var(--foreground), var(--background), var(--muted),
                    var(--muted-foreground), var(--border), var(--accent),
                    var(--accent-foreground), var(--primary), and
                    var(--primary-foreground).
                </p>
                <h4>Restrictions</h4>
                <p>
                    Only exact block selectors, optionally grouped with commas.
                    No nested selectors, at-rules, URLs, custom property
                    definitions, !important, negative dimensions, positioning,
                    display, transforms, or animations. Combined theme: 50 KB
                    maximum. Each override: 10,000 characters maximum.
                </p>
            </div>
        </details>
    );
}
