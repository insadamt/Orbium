<?php

return [
    'max_attachment_mb' => min(100, max(1, (int) env('ORBIUM_MAX_ATTACHMENT_MB', 100))),
];
