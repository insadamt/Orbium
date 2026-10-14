<?php

namespace App\Services\DocumentExport;

final readonly class OfficeExportOptions
{
    public function __construct(
        public string $title,
        public string $format,
        public string $paper,
        public string $orientation,
        public bool $pageNumbers,
    ) {}

    /** @return array{title: string, paper: string, orientation: string, page_numbers: bool} */
    public function toRendererInput(): array
    {
        return ['title' => $this->title, 'paper' => $this->paper, 'orientation' => $this->orientation, 'page_numbers' => $this->pageNumbers];
    }
}
