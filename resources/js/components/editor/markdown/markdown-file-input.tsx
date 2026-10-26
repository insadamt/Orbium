import type { useMarkdownUpload } from './use-markdown-upload';
export function MarkdownFileInput({
    upload,
}: {
    upload: ReturnType<typeof useMarkdownUpload>;
}) {
    return (
        <input
            ref={upload.fileInput}
            type="file"
            className="hidden"
            aria-label="Upload document attachment"
            onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void upload.uploadSelectedFiles(files);
                else upload.clearUploadRequest();
            }}
        />
    );
}
