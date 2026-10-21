<?php

namespace App\Services\Boards;

use Illuminate\Support\Str;

final class BoardStressScene
{
    /** @return list<array<string, mixed>> */
    public function objects(int $count, string $kind, string $layout): array
    {
        $objects = [];
        $kinds = ['text', 'text', 'list', 'code', 'table', 'mermaid', 'math', 'heading', 'quote', 'callout'];
        for ($index = 0; $index < $count; $index++) {
            $blockKind = $kind === 'plain' ? 'text' : $kinds[$index % count($kinds)];
            $objects[] = [
                'id' => (string) Str::uuid(),
                'block_type' => $blockKind,
                'content_format_version' => 1,
                'data' => $this->data($blockKind, $index + 1),
                'x' => 80 + ($index % 10) * ($layout === 'dense' ? 180 : 640),
                'y' => 80 + intdiv($index, 10) * ($layout === 'dense' ? 140 : 600),
                'width' => 520,
                'height' => 360,
                'layer' => $index,
            ];
        }

        return $objects;
    }

    /** @return array<string, mixed> */
    private function data(string $kind, int $number): array
    {
        $label = sprintf('Block %04d', $number);

        return match ($kind) {
            'heading' => ['level' => 2, 'content' => $this->inline("{$label} — region ".(intdiv($number - 1, 10) + 1))],
            'list' => ['list_style' => 'check', 'items' => array_map(fn (int $item): array => [
                'content' => $this->inline("{$label}: manual check {$item}"),
                'checked' => $item % 2 === 0,
                'indent' => $item === 4 ? 1 : 0,
            ], range(1, 5))],
            'code' => ['language' => 'typescript', 'source' => $this->codeSource($label)],
            'table' => ['rows' => $this->tableRows($label)],
            'mermaid' => ['source' => "flowchart TD\n  A[{$label}] --> B[Read records]\n  B --> C{Visible?}\n  C -->|Yes| D[Schedule preview]\n  C -->|No| E[Retain or release]\n  D --> F[Edit content]\n  F --> G[Save changes]\n  G --> H[Reload]\n  H --> B"],
            'math' => ['source' => '\\begin{aligned} S_{'.$number.'} &= \\sum_{k=1}^{n} \\frac{k^2}{1+k} \\\\ f(x) &= \\int_0^x e^{-t^2}\\,dt \\\\ A &= \\begin{pmatrix}1&2\\\\3&4\\end{pmatrix} \\end{aligned}'],
            'quote' => ['content' => $this->inline("{$label}: pan away and return, then check that selection, resizing and editing still work.")],
            'callout' => ['content' => $this->inline("{$label}: synthetic stress content. Try undo/redo, wait for Saved, and reload to verify persistence.")],
            default => ['content' => $this->inline("{$label}. Synthetic text for repeatable Board profiling. Edit this paragraph, drag it, resize its width, and verify that nearby rich blocks remain responsive.")],
        };
    }

    /** @return list<array{type: string, text: string}> */
    private function inline(string $text): array
    {
        return [['type' => 'text', 'text' => $text]];
    }

    /** @return list<list<list<array{type: string, text: string}>>> */
    private function tableRows(string $label): array
    {
        $rows = [];
        for ($row = 0; $row < 8; $row++) {
            $rows[] = array_map(fn (int $column): array => $this->inline($row === 0
                ? "{$label} / column {$column}"
                : "Row {$row}, value ".($row * $column)), range(1, 4));
        }

        return $rows;
    }

    private function codeSource(string $label): string
    {
        return "// {$label}\n".<<<'SOURCE'
type Sample = { id: number; value: number; visible: boolean };

function summarizeVisibleSamples(samples: Sample[]) {
    const visibleSamples = samples.filter((sample) => sample.visible);
    const total = visibleSamples.reduce((sum, sample) => sum + sample.value, 0);

    return {
        count: visibleSamples.length,
        total,
        average: visibleSamples.length ? total / visibleSamples.length : 0,
    };
}

const samples = Array.from({ length: 100 }, (_, index) => ({
    id: index,
    value: index * 2,
    visible: index % 3 === 0,
}));

console.log(summarizeVisibleSamples(samples));
SOURCE;
    }
}
