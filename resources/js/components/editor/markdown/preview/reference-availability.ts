export function referenceAvailabilityRequest(
    href: string,
    origin: string,
): string | null {
    const url = new URL(href, origin);
    if (url.origin !== origin) return null;
    const page =
        /^\/workspaces\/([1-9]\d*)\/(?:nodes|documents|databases)\/([1-9]\d*)$/.exec(
            url.pathname,
        );
    if (page)
        return `/workspaces/${page[1]}/references/availability?kind=node&id=${page[2]}`;
    const asset =
        /^\/workspaces\/([1-9]\d*)\/documents\/([1-9]\d*)\/attachments\/([1-9]\d*)$/.exec(
            url.pathname,
        );
    return asset
        ? `/workspaces/${asset[1]}/references/availability?kind=attachment&id=${asset[3]}&owner_id=${asset[2]}`
        : null;
}
export async function checkReferenceAvailability(
    href: string,
    origin: string,
): Promise<boolean> {
    const endpoint = referenceAvailabilityRequest(href, origin);
    if (!endpoint) return true;
    const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if ([403, 404, 410].includes(response.status)) return false;
    if (!response.ok)
        throw new Error('Could not check this item. Please try again.');
    const data = (await response.json()) as { available?: unknown };
    if (typeof data.available !== 'boolean')
        throw new Error('Could not check this item. Please try again.');
    return data.available;
}
