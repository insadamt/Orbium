import type { BlockStyleType } from './block-style-types';

export type StyleSource = 'base' | BlockStyleType;
export type StyleDiagnostic = {
    source: StyleSource;
    message: string;
    from: number;
    to: number;
};

export class CssSourceError extends Error {
    constructor(
        message: string,
        public from = 0,
        public to = from + 1,
    ) {
        super(message);
    }
}
