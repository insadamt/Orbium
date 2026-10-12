export function interactionButton(
    label: string,
    text: string,
    run: () => void,
) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rounded px-2 py-1.5 text-sm hover:bg-accent';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = text;
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', run);
    return button;
}

export function interactionSelect(
    label: string,
    choices: [string, string][],
    value: string,
    apply: (value: string) => void,
) {
    const select = document.createElement('select');
    select.setAttribute('aria-label', label);
    select.className =
        'rounded border border-border bg-background px-2 py-1 text-sm';
    for (const [value, text] of choices) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.append(option);
    }
    select.value = value;
    select.addEventListener('change', () => apply(select.value));
    return select;
}
