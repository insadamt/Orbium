<?php

namespace App\Services\Library;

use Illuminate\Http\Request;

final readonly class LibraryBrowseData
{
    public function __construct(public string $query = '', public string $type = 'all', public string $sort = 'newest', public int $page = 1) {}

    public static function fromRequest(Request $request): self
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:255'], 'type' => ['nullable', 'in:all,images,files'],
            'sort' => ['nullable', 'in:newest,name,size'], 'page' => ['nullable', 'integer', 'min:1'],
        ]);

        return new self(trim($data['q'] ?? ''), $data['type'] ?? 'all', $data['sort'] ?? 'newest', (int) ($data['page'] ?? 1));
    }

    public function filters(): array
    {
        return ['q' => $this->query, 'type' => $this->type, 'sort' => $this->sort];
    }
}
