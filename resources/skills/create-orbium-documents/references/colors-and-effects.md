# Colors, themes, and visual effects

## Three styling layers

1. **Portable body formatting:** inline colors/underline, direction/alignment, list display type, image caption/width/alignment, divider color/thickness/style, rich-table cell properties. Stored as documented Markdown directives and preserved by native .orbie.
2. **Account editor CSS:** typography, backgrounds, borders, corners, spacing, shadows on stable block containers. Distributed as a separate CSS file and applied in Editor styles. It is not embedded in a document package.
3. **Application Appearance:** Light/Dark/System, Normal/Frosted glass surfaces, wallpaper controls, and pause/reduced motion behavior. These are application preferences, not body metadata or importable document effects.

Choose the layer that implements the user's request. Explain separately applied CSS or Appearance changes with the deliverable.

## Complete portable text palette

Use `:orbium[Text]{"color":"preset:blue"}`. Presets adapt to the current theme. Current values:

| Token             | Light     | Dark      |
| ----------------- | --------- | --------- |
| `preset:charcoal` | `#3f2c24` | `#f0d3c2` |
| `preset:gray`     | `#624234` | `#dfbca7` |
| `preset:red`      | `#eb2424` | `#eb2424` |
| `preset:orange`   | `#eb8424` | `#eb8424` |
| `preset:amber`    | `#7b500b` | `#edcc82` |
| `preset:green`    | `#24eb4b` | `#24eb4b` |
| `preset:teal`     | `#24c9eb` | `#24c9eb` |
| `preset:blue`     | `#75a1ff` | `#75a1ff` |
| `preset:purple`   | `#3700ff` | `#ebe424` |
| `preset:pink`     | `#eb24e4` | `#eb24e4` |

Use preset tokens rather than hardcoding their current values if the user wants theme adaptation. `preset:purple` deliberately resolves to different hues in Light and Dark; do not assume token names specify a fixed hue. For a constant color use a lowercase six-digit hex such as `#75a1ff`. Portable color fields do not accept CSS names, shorthand hex, alpha hex, rgb(), gradients, or theme variables. Body spans support text color, not per-span background/highlight color.

```markdown
:orbium[**Important**]{"color":"preset:red","underline":true}
:orbium[Fixed blue]{"color":"#75a1ff"}
:orbium[Underlined only]{"underline":true}
```

Omit color for theme-default text. Omit underline rather than writing false. Preserve nested inline Markdown; code spans remain literal. Use semantic color sparingly and check contrast against Light and Dark backgrounds; the bright presets are not all equally readable on every surface.

## Native block appearance

Use `kind:block` for `dir` (`auto`, `ltr`, `rtl`), paragraph/heading `align` (`left`, `center`, `right`), ordered-list `listType` (`1`, `a`, `A`, `i`, `I`), and divider fields. Defaults are represented by omitting optional fields. Divider color accepts only fixed lowercase six-digit hex, thickness integer 1–12, style `solid`, `dashed`, `dotted`, or `double`. Use thickness at least 3 to distinguish double lines. Image width is a positive integer, and alignment is `start`, `left`, `center`, or `right`. Cells support their documented alignment/header/spans/widths. See blocks.md for examples.

These directives have no font-size, opacity, background, shadow, glow, blur, animation, or arbitrary CSS keys. Invalid metadata blocks saving/import rather than silently creating an effect.

## Account CSS selectors

Only these exact selectors are accepted (comma grouping allowed):

| Block                        | Selector                                                             |
| ---------------------------- | -------------------------------------------------------------------- |
| Paragraph                    | `.orbium-paragraph`                                                  |
| H1 / H2 / H3                 | `.orbium-heading-1` / `.orbium-heading-2` / `.orbium-heading-3`      |
| Bullet / ordered / task list | `.orbium-bullet-list` / `.orbium-ordered-list` / `.orbium-checklist` |
| Quote / callout              | `.orbium-quote` / `.orbium-callout`                                  |
| Code / table                 | `.orbium-code` / `.orbium-table`                                     |
| Image / file                 | `.orbium-image` / `.orbium-file`                                     |
| Mermaid / math               | `.orbium-mermaid` / `.orbium-math`                                   |
| Divider                      | `.orbium-divider`                                                    |

Selectors target block containers. Image styles target the wrapper; table styles target the table. Paragraph rules also affect paragraphs inside composites. Explicit body inline formatting takes precedence over theme styling. Page title, cover, icon, and app controls are outside this scope. H4–H6 source is retained, but there are no corresponding custom-style selectors in this contract.

### Exact supported properties

```text
color, background-color
font-family, font-size, font-weight, font-style
line-height, letter-spacing, word-spacing
text-align, text-decoration, text-transform, text-indent
border, border-width, border-style, border-color
border-top, border-right, border-bottom, border-left
border-inline-start, border-inline-end, border-block-start, border-block-end
border-radius
padding, padding-top, padding-right, padding-bottom, padding-left
padding-inline, padding-inline-start, padding-inline-end
padding-block, padding-block-start, padding-block-end
margin, margin-top, margin-right, margin-bottom, margin-left
margin-inline, margin-inline-start, margin-inline-end
margin-block, margin-block-start, margin-block-end
box-shadow
```

Use logical borders/padding/margins for RTL-aware layouts. Values must parse as CSS and be supported by the receiving browser. Allowed value functions: rgb, rgba, hsl, hsla, oklch, oklab, lab, lch, color, color-mix, calc, min, max, clamp, var. Units and numeric bounds must make sense for the property; negative dimensions are rejected.

### Theme-aware variables

Allowed variables: `--foreground`, `--background`, `--muted`, `--muted-foreground`, `--border`, `--accent`, `--accent-foreground`, `--primary`, `--primary-foreground`. Reference them with `var(...)`; do not define custom properties. Prefer foreground/background pairs for readable Light/Dark themes.

### Unsupported CSS

No descendant/element/ID/pseudo/nested selectors, at-rules (including @media, @import, @font-face, @keyframes), URLs, custom property definitions, !important, negative dimensions, display/position/layout rules, transforms, animation/transition, filter/backdrop-filter, text-shadow, opacity, or gradients. Shadows can provide supported static depth; blur and motion belong to app Appearance and cannot be introduced by editor CSS. No per-page CSS selection exists here: a rule affects all matching blocks in the account.

Combined exported UTF-8 theme limit: 50,000 bytes. Each block override: 10,000 characters. Base stylesheet uses complete rules; overrides use declarations only. Later block overrides take precedence. Importing a CSS file replaces the draft base and clears overrides. Import/apply happens through Settings → Editor styles → Customize styles. Invalid drafts retain the last valid preview with diagnostics; Apply saves valid enabled settings. Cancel discards draft edits. Export combines base rules followed by overrides.

## Supported effect recipes

Rounded note with neutral background and subtle static depth:

```css
.orbium-callout {
    color: var(--foreground);
    background-color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
```

Readable typography and a semantic accent:

```css
.orbium-paragraph {
    line-height: 1.8;
    color: var(--foreground);
}
.orbium-heading-1 {
    font-size: 2.2rem;
    letter-spacing: 0.01em;
}
.orbium-heading-2,
.orbium-heading-3 {
    color: #75a1ff;
}
.orbium-quote {
    border-inline-start: 3px solid #75a1ff;
    padding: 12px 20px;
    background-color: var(--muted);
    border-radius: 8px;
}
```

Inset depth or a restrained static halo can use `box-shadow` with nonnegative dimensions and a valid color, for example `inset 0 0 6px rgba(0, 0, 0, 0.12)` or `0 0 8px rgba(117, 161, 255, 0.18)`. These are static shadows, not animation or actual frosted blur. Use them only when requested and confirm readability in the live preview.

## Application Appearance

Settings → Appearance changes Light/Dark/System and Normal/Frosted surfaces. Wallpaper opens the wallpaper picker/editor; select a still/animated choice or upload an image, adjust available controls, then Apply. Cancel preserves saved settings. Wallpaper choices expose their own controls rather than a universal effect schema. Pause animated wallpapers and OS reduced motion select still behavior; effects and transitions may be reduced according to the app's current behavior. These settings affect the application, not portable document body data. Do not promise that another installation will reproduce them from a `.orbie` or document ZIP.
