<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EditorStylesController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/editor-styles');
    }

    public function preferences(Request $request): JsonResponse
    {
        return response()->json($request->user()->editor_styles);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'stylesheet' => ['nullable', 'string', 'max:50000'],
            'overrides' => ['present', 'array:paragraph,heading-1,heading-2,heading-3,bullet-list,ordered-list,checklist,quote,callout,code,table,image,file,mermaid,math,divider'],
            'overrides.*' => ['nullable', 'string', 'max:10000'],
        ]);

        $cssParts = [];
        if (($validated['stylesheet'] ?? '') !== '') {
            $cssParts[] = $validated['stylesheet'];
        }
        foreach ($validated['overrides'] as $blockType => $declarations) {
            $declarations = trim($declarations ?? '');
            if ($declarations !== '') {
                $cssParts[] = ".orbium-{$blockType} {\n{$declarations}\n}";
            }
        }
        $exportedCss = implode("\n\n", $cssParts);
        if (strlen($exportedCss) > 50000) {
            throw ValidationException::withMessages(['stylesheet' => 'The combined theme must be at most 50 KB, including block overrides.']);
        }

        $request->user()->forceFill(['editor_styles' => $validated])->save();

        return to_route('editor-styles.edit');
    }
}
