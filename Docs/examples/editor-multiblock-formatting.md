# Formatting review

First paragraph with plain text and **existing bold text**.

Second paragraph with *italic text*, :orbium[blue text]{"color":"preset:blue"}, and ordinary text.

Third paragraph contains :orbium[underlined text]{"underline":true} and [a link](https://example.com "Preserve this title").

- First bullet with plain text.
- Second bullet with **bold text** and plain text.

1. First numbered item.
2. Second numbered item.

- [ ] Unchecked task with plain text.
- [x] Checked task with *italic text*.

> A quote with plain and **bold** text.
> A continuation line with plain text.

> [!NOTE] Callout review
> First callout paragraph with plain and **bold** text.
>
> Second callout paragraph with :orbium[green text]{"color":"preset:green"}.

A final paragraph with `inline code`, escaped \*literal asterisks\*, and an ampersand: &amp;.

---

```js
const untouched = "Do not format this code block";
```

Final plain paragraph after the code block.
