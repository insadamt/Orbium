import { generate, lexer, parse, walk, type CssNode } from 'css-tree';
import {
    CssSourceError,
    type StyleDiagnostic,
    type StyleSource,
} from './style-diagnostics';
import {
    blockStyleTypes,
    exportEditorStyles,
    type EditorStyles,
} from './block-style-types';

const supportedSelectors = new Set(
    blockStyleTypes.map(([type]) => `.orbium-${type}`),
);
const allowedProperties = new Set([
    'color',
    'background-color',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-decoration',
    'text-transform',
    'text-indent',
    'border',
    'border-width',
    'border-style',
    'border-color',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-inline-start',
    'border-inline-end',
    'border-block-start',
    'border-block-end',
    'border-radius',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'padding-inline',
    'padding-inline-start',
    'padding-inline-end',
    'padding-block',
    'padding-block-start',
    'padding-block-end',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'margin-inline',
    'margin-inline-start',
    'margin-inline-end',
    'margin-block',
    'margin-block-start',
    'margin-block-end',
    'box-shadow',
]);
const themeVariables = new Set([
    '--foreground',
    '--background',
    '--muted',
    '--muted-foreground',
    '--border',
    '--accent',
    '--accent-foreground',
    '--primary',
    '--primary-foreground',
]);

function validateDeclarationValue(node: CssNode): string {
    if (node.type !== 'Declaration')
        throw new Error('Only CSS declarations are allowed inside a block.');
    if (!allowedProperties.has(node.property))
        throw new Error(
            `Property "${node.property}" is not supported. Use appearance properties such as color, padding, border, or font-size.`,
        );
    if (node.important)
        throw new Error(
            'Remove !important. Block overrides already take priority.',
        );
    let usesVariable = false;
    walk(node.value, (part) => {
        if (part.type === 'Raw' || part.type === 'Url')
            throw new Error(
                'External URLs and unrecognized CSS values are not supported.',
            );
        if (
            part.type === 'Function' &&
            ![
                'rgb',
                'rgba',
                'hsl',
                'hsla',
                'oklch',
                'oklab',
                'lab',
                'lch',
                'color',
                'color-mix',
                'calc',
                'min',
                'max',
                'clamp',
                'var',
            ].includes(part.name.toLowerCase())
        ) {
            throw new Error(`Function "${part.name}" is not supported.`);
        }
        if (part.type === 'Function' && part.name === 'var')
            usesVariable = true;
        if (
            part.type === 'Identifier' &&
            part.name.startsWith('--') &&
            !themeVariables.has(part.name)
        )
            throw new Error(`Unknown theme variable "${part.name}".`);
        if (part.type === 'Dimension' && part.value.startsWith('-'))
            throw new Error('Negative dimensions are not supported.');
    });
    if (!usesVariable && lexer.matchProperty(node.property, node.value).error)
        throw new Error(`Invalid value for "${node.property}".`);
    const value = generate(node.value);
    if (typeof CSS !== 'undefined' && !CSS.supports(node.property, value))
        throw new Error(
            `Your browser does not support this value for "${node.property}".`,
        );
    return `${node.property}:${value}`;
}

function validateDeclaration(node: CssNode): string {
    try {
        return validateDeclarationValue(node);
    } catch (error) {
        throw new CssSourceError(
            error instanceof Error ? error.message : 'Invalid declaration.',
            node.loc?.start.offset,
            node.loc?.end.offset,
        );
    }
}

function rejectNode(node: CssNode, message: string): never {
    throw new CssSourceError(
        message,
        node.loc?.start.offset,
        node.loc?.end.offset,
    );
}

function parseStrict(
    source: string,
    context: 'stylesheet' | 'declarationList',
): CssNode {
    return parse(source, {
        context,
        positions: true,
        onParseError(error) {
            throw error;
        },
    });
}

function appendStyleRule(
    rules: string[],
    selectors: string[],
    declarations: string[],
): void {
    rules.push(`${selectors.join(',')}{${declarations.join(';')}}`);
    const codeSelectors = selectors.filter((selector) =>
        selector.endsWith(' .orbium-code'),
    );
    const typography = new Set([
        'font-family',
        'font-size',
        'font-weight',
        'font-style',
        'line-height',
        'letter-spacing',
        'word-spacing',
        'color',
    ]);
    const inherited = declarations
        .map((declaration) => declaration.split(':')[0])
        .filter((property) => typography.has(property))
        .map((property) => `${property}:inherit`);
    if (codeSelectors.length && inherited.length) {
        rules.push(
            `${codeSelectors.flatMap((selector) => [`${selector} pre`, `${selector} pre code`]).join(',')}{${inherited.join(';')}}`,
        );
    }
}

function compileBaseStyles(source: string, scope: string): string[] {
    const ast = parseStrict(source, 'stylesheet');
    const rules: string[] = [];
    if (ast.type !== 'StyleSheet') throw new Error('Expected a stylesheet.');
    ast.children.forEach((rule) => {
        if (rule.type !== 'Rule' || rule.prelude?.type !== 'SelectorList') {
            rejectNode(
                rule,
                'Use block selectors only. Imports, media queries, and other at-rules are not supported.',
            );
        }
        const selectors: string[] = [];
        rule.prelude.children.forEach((selector) => {
            const name = generate(selector);
            if (
                !supportedSelectors.has(
                    name as `.orbium-${(typeof blockStyleTypes)[number][0]}`,
                )
            ) {
                rejectNode(
                    selector,
                    `Unsupported selector "${name}". Choose a documented .orbium-* block selector.`,
                );
            }
            selectors.push(`${scope} .orbium-editor ${name}`);
        });
        const declarations: string[] = [];
        rule.block.children.forEach((node) =>
            declarations.push(validateDeclaration(node)),
        );
        appendStyleRule(rules, selectors, declarations);
    });
    return rules;
}

function compileOverride(
    source: string,
    type: string,
    scope: string,
): string[] {
    const ast = parseStrict(source, 'declarationList');
    if (ast.type !== 'DeclarationList')
        throw new Error('Expected CSS declarations.');
    const declarations: string[] = [];
    ast.children.forEach((node) =>
        declarations.push(validateDeclaration(node)),
    );
    const rules: string[] = [];
    if (declarations.length)
        appendStyleRule(
            rules,
            [`${scope} .orbium-editor .orbium-${type}`],
            declarations,
        );
    return rules;
}

export type StyleValidation = {
    css: string | null;
    diagnostics: StyleDiagnostic[];
};

export function validateEditorStyleDraft(
    styles: EditorStyles,
    scope: string,
): StyleValidation {
    if (new TextEncoder().encode(exportEditorStyles(styles)).length > 50000) {
        return {
            css: null,
            diagnostics: [
                {
                    source: 'base',
                    from: 0,
                    to: Math.min(styles.stylesheet.length, 1),
                    message:
                        'The combined theme must be at most 50 KB, including block overrides.',
                },
            ],
        };
    }
    const diagnostics: StyleDiagnostic[] = [];
    const rules: string[] = [];
    function validateSource(
        source: StyleSource,
        text: string,
        compile: () => string[],
    ) {
        try {
            rules.push(...compile());
        } catch (error) {
            const position =
                error instanceof CssSourceError
                    ? error.from
                    : error &&
                        typeof error === 'object' &&
                        'offset' in error &&
                        typeof error.offset === 'number'
                      ? error.offset
                      : 0;
            const from = Math.max(0, Math.min(text.length, position));
            const end = error instanceof CssSourceError ? error.to : from + 1;
            diagnostics.push({
                source,
                from,
                to: Math.max(from, Math.min(text.length, end)),
                message:
                    error instanceof Error ? error.message : 'Invalid CSS.',
            });
        }
    }
    validateSource('base', styles.stylesheet, () =>
        compileBaseStyles(styles.stylesheet, scope),
    );
    for (const [type] of blockStyleTypes) {
        const text = styles.overrides[type] ?? '';
        validateSource(type, text, () => {
            if (text.length > 10000)
                throw new Error(
                    'Block overrides must be at most 10,000 characters.',
                );
            return compileOverride(text, type, scope);
        });
    }

    return { css: diagnostics.length ? null : rules.join('\n'), diagnostics };
}

export function compileEditorStyles(
    styles: EditorStyles,
    scope: string,
): string {
    const validation = validateEditorStyleDraft(styles, scope);
    if (validation.css === null)
        throw new Error(validation.diagnostics[0].message);
    return validation.css;
}
