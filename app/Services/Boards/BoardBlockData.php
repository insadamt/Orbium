<?php

namespace App\Services\Boards;

use App\Models\Attachment;
use App\Models\Node;
use App\Services\Library\AttachmentMediaTypes;
use App\Services\MindMaps\MindMapData;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final class BoardBlockData
{
    public const KINDS = ['text', 'heading', 'list', 'quote', 'callout', 'code', 'table', 'image', 'file', 'math', 'mermaid', 'divider', 'resource', 'drawing', 'mindmap'];

    public function validate(string $kind, array $data): array
    {
        if ($kind === 'mindmap') {
            if (array_keys($data) !== ['mindmap']) {
                $this->invalid('A Mind Map block stores only its topic tree.');
            }

            return ['mindmap' => app(MindMapData::class)->validate($data['mindmap'], 'objects')];
        }
        if ($kind === 'drawing') {
            return (new BoardDrawingData)->validate($data);
        }
        $fields = match ($kind) {
            'text', 'quote', 'callout' => ['content'],
            'heading' => ['content', 'level'],
            'list' => ['items', 'list_style'],
            'table' => ['rows', 'table_source'],
            'code' => ['source', 'language'],
            'math', 'mermaid' => ['source'],
            'image' => ['attachment_id', 'name', 'caption'],
            'file' => ['attachment_id', 'name', 'caption', 'media_kind'],
            'divider' => [],
            'resource' => ['target_node_id'],
            default => $this->invalid('Unsupported Board block type.'),
        };
        $rules = ['data' => ['present', 'array:'.implode(',', ($kind === 'resource' ? [...$fields, 'text_scale'] : [...$fields, 'align', 'dir', 'legacy_source', 'text_scale', 'manual_height', 'image_fit', 'image_position']))],
            'data.align' => ['sometimes', 'in:left,center,right'], 'data.dir' => ['sometimes', 'in:auto,ltr,rtl'],
            'data.text_scale' => ['sometimes', 'numeric', 'between:0.25,8'],
            'data.manual_height' => ['sometimes', 'boolean'],
            'data.image_fit' => ['sometimes', 'in:contain,cover'],
            'data.image_position' => ['sometimes', 'array:x,y', 'required_array_keys:x,y'],
            'data.image_position.x' => ['required_with:data.image_position', 'numeric', 'between:0,100'],
            'data.image_position.y' => ['required_with:data.image_position', 'numeric', 'between:0,100'],
            'data.legacy_source' => ['sometimes', 'string', 'max:131072']];
        foreach ($fields as $field) {
            $rules['data.'.$field] = match ($field) {
                'media_kind' => ['sometimes', 'in:pdf,video,audio'],
                'table_source' => ['sometimes', 'string', 'max:262144'],
                'content', 'items', 'rows' => ['present', 'array', 'list'],
                'target_node_id' => ['required', 'integer', 'min:1', 'max:9007199254740991'],
                'attachment_id' => ['present', 'nullable', 'integer', 'min:1', 'max:9007199254740991'],
                'level' => ['required', 'integer', 'between:1,3'],
                'list_style' => ['required', 'in:bullet,ordered,check'],
                'language' => ['present', 'string', 'max:100'],
                default => ['present', 'nullable', 'string'],
            };
        }
        Validator::make(['data' => $data], $rules)->validate();
        foreach (['source', 'name', 'caption'] as $field) {
            if (in_array($field, $fields, true)) {
                $data[$field] ??= '';
            }
        }
        foreach (['level', 'attachment_id', 'target_node_id'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = (int) $data[$field];
            }
        }
        //
        // Keep presentation numbers typed consistently when validation receives numeric form values.
        //
        if (isset($data['text_scale'])) {
            $data['text_scale'] = (float) $data['text_scale'];
        }
        if (isset($data['manual_height'])) {
            $data['manual_height'] = (bool) $data['manual_height'];
        }
        if (isset($data['image_position'])) {
            $data['image_position'] = ['x' => (float) $data['image_position']['x'], 'y' => (float) $data['image_position']['y']];
        }
        if (isset($data['content'])) {
            $this->validateInline($data['content']);
        }
        if ($kind === 'list') {
            if (count($data['items']) < 1 || count($data['items']) > 1000) {
                $this->invalid('Use between 1 and 1,000 list items.');
            }
            foreach ($data['items'] as &$item) {
                Validator::make(['item' => $item], ['item' => ['required', 'array:content,checked,indent'], 'item.content' => ['present', 'array', 'list'], 'item.checked' => ['required', 'boolean'], 'item.indent' => ['required', 'integer', 'between:0,12']])->validate();
                $item['checked'] = (bool) $item['checked'];
                $item['indent'] = (int) $item['indent'];
                $this->validateInline($item['content']);
            }
        }
        if ($kind === 'table') {
            $firstRow = $data['rows'][0] ?? null;
            if (! is_array($firstRow) || ! array_is_list($firstRow)) {
                $this->invalid('Use an array of table cell rows.');
            }
            $columns = count($firstRow);
            if (count($data['rows']) < 1 || count($data['rows']) > 100 || $columns < 1 || $columns > 30) {
                $this->invalid('Use a table with 1–100 rows and 1–30 columns.');
            }
            foreach ($data['rows'] as $row) {
                if (! is_array($row) || ! array_is_list($row) || count($row) !== $columns) {
                    $this->invalid('Every table row needs the same number of cells.');
                }
                foreach ($row as $cell) {
                    $this->validateInline($cell);
                }
            }
        }
        if ($kind === 'table' && isset($data['table_source'])) {
            (new BoardTableSource)->validate($data['table_source'], $data['rows']);
        }
        if ($kind === 'mermaid' && strlen($data['source']) > 50000) {
            $this->invalid('Mermaid source exceeds 50,000 bytes.');
        }

        return $data;
    }

    private function validateInline(mixed $content): void
    {
        if (! is_array($content) || ! array_is_list($content) || count($content) > 10000) {
            $this->invalid('Invalid Board inline text.');
        }
        foreach ($content as $inline) {
            Validator::make(['inline' => $inline], ['inline' => ['required', 'array:type,text,marks'], 'inline.type' => ['required', 'in:text,hardBreak'], 'inline.text' => ['required_if:inline.type,text', 'string'], 'inline.marks' => ['sometimes', 'array', 'list', 'max:8']])->validate();
            foreach ($inline['marks'] ?? [] as $mark) {
                Validator::make(['mark' => $mark], [
                    'mark' => ['required', 'array:type,attrs'],
                    'mark.type' => ['required', 'in:bold,italic,underline,strike,code,link,textColor'],
                    'mark.attrs' => ['sometimes', ($mark['type'] ?? '') === 'textColor' ? 'array:color' : 'array:href'],
                    'mark.attrs.href' => ['required_if:mark.type,link', 'string', 'max:2048'],
                    'mark.attrs.color' => ['required_if:mark.type,textColor', 'string', 'regex:/\A(?:#[0-9a-fA-F]{6}|preset:(?:charcoal|gray|red|orange|amber|green|teal|blue|purple|pink))\z/'],
                ])->validate();
                if (($mark['type'] ?? '') === 'link') {
                    $url = $mark['attrs']['href'];
                    if (preg_match('/[\x00-\x20\x7f]/', $url) || str_starts_with($url, '//') || (preg_match('/^[a-z][a-z0-9+.-]*:/i', $url) && ! preg_match('/^(https?:\/\/|mailto:)/i', $url))) {
                        $this->invalid('Use an ordinary safe link; page/file references are separate Board objects.');
                    }
                }
            }
        }
    }

    public function attachmentIds(array $data): array
    {
        $ids = isset($data['attachment_id']) ? [(int) $data['attachment_id']] : [];
        if (isset($data['table_source'])) {
            $ids = [...$ids, ...(new BoardTableSource)->attachmentIds($data['table_source'])];
        }

        return array_values(array_unique($ids));
    }

    public function validateAttachments(Node $node, array $objects): void
    {
        $ids = [];
        foreach ($objects as $object) {
            $ids = [...$ids, ...$this->attachmentIds($object['data'])];
        }
        $files = Attachment::query()->where('workspace_id', $node->workspace_id)->whereIn('id', array_unique($ids))->get()->keyBy('id');
        foreach (array_unique($ids) as $id) {
            if (! $files->has($id)) {
                $this->invalid('A Board file is unavailable in this workspace.');
            }
        }
        foreach ($objects as $object) {
            if (isset($object['data']['attachment_id'], $object['data']['media_kind'])) {
                $allowedTypes = match ($object['data']['media_kind']) {
                    'pdf' => ['application/pdf'],
                    'video' => AttachmentMediaTypes::VIDEO,
                    'audio' => AttachmentMediaTypes::AUDIO,
                };
                if (! in_array($files[$object['data']['attachment_id']]->mime_type, $allowedTypes, true)) {
                    $this->invalid('Choose a file matching the Board media type.');
                }
            }
            if ($object['block_type'] === 'image' && isset($object['data']['attachment_id']) && ! in_array($files[$object['data']['attachment_id']]->mime_type, ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true)) {
                $this->invalid('An image block requires an owned PNG, JPEG, GIF or WebP.');
            }
        }
    }

    public function containsNul(mixed $value): bool
    {
        if (is_string($value)) {
            return str_contains($value, "\0");
        }
        if (! is_array($value)) {
            return false;
        }
        foreach ($value as $entry) {
            if ($this->containsNul($entry)) {
                return true;
            }
        }

        return false;
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['objects' => $message]);
    }
}
