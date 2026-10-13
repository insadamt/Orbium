<?php

namespace App\Services\DocumentTransfer;

final readonly class TransferSerializationOptions
{
    /**
     * @param  array<int, string>  $nodeDestinations
     * @param  array<int, string>  $attachmentDestinations
     */
    public function __construct(
        public bool $preserveFormatting = false,
        public array $nodeDestinations = [],
        public array $attachmentDestinations = [],
    ) {}
}
