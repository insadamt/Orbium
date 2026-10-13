import { csrfToken } from '../editor/editor-api';
export async function transferRequest(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-CSRF-TOKEN', csrfToken());
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const failure = (await response.json().catch(() => ({}))) as {
            message?: string;
            errors?: Record<string, string[]>;
        };
        throw new Error(
            Object.values(failure.errors ?? {}).flat()[0] ??
                failure.message ??
                'The transfer could not be completed.',
        );
    }
    return response;
}
