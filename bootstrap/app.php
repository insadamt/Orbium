<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Document and Board bodies, including incremental changes, must retain significant spaces and empty strings.
        $preserveDocumentContent = static fn (Request $request): bool => $request->isJson()
            && (($request->isMethod('PUT') && $request->is('workspaces/*/documents/*'))
                || (($request->isMethod('PUT') || $request->isMethod('PATCH')) && $request->is('workspaces/*/boards/*/content'))
                || ($request->isMethod('POST') && $request->is('workspaces/*/boards/*/documents')));
        $middleware->trimStrings(except: [$preserveDocumentContent]);
        $middleware->convertEmptyStringsToNull(except: [$preserveDocumentContent]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
