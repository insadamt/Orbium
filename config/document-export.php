<?php

return [
    'node_binary' => env('ORBIUM_EXPORT_NODE_BINARY', 'node'),
    'libreoffice_binary' => env('ORBIUM_LIBREOFFICE_BINARY', 'soffice'),
    'timeout_seconds' => 60,
    'max_media_bytes' => 30 * 1024 * 1024,
];
