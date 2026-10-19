export class DocumentSaveError extends Error {
    constructor(
        message: string,
        public status = 0,
        public conflict = false,
    ) {
        super(message);
    }
}
