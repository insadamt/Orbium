<?php

namespace App\Services\DocumentTransfer;

final readonly class TransferSerializationOptions
{
    /**
     * @param  array<int, string>  $nodeDestinations
     * @param  array<int, string>  $attachmentDestinations
     * @param  array<int, int>  $excludedAttachmentIds
     */
    public function __construct(
        public bool $preserveFormatting = false,
        public array $nodeDestinations = [],
        public array $attachmentDestinations = [],
        public array $excludedAttachmentIds = [],
    ) {}
}
