# Phase 5 review — document opening and tab handoff regression

Date: 2026-10-06. Follow-up to `05-tab-switching-performance.md`.

## Defect

The first retained-tab pass introduced two ordering problems and an extra loading boundary:

- Inertia commits its response before calling the visit's success callback. Navigation's page effect could therefore run while `pending` was true and the active tab still had its outgoing URL. Recording was skipped and the cache rejected the incoming page. After success recorded the URL, the effect did not rerun solely for that store update. The document route returned no top-level content, leaving the document blank until refresh.
- Cached activation changed the selected tab before Inertia finished restoring its page/history. The retained workspace required the destination URL to equal the current Inertia URL, so it hid both editors during this interval.
- The document surface was dynamically imported a second time by the retained workspace even though Inertia had already loaded the route. Its generic Loading document fallback and the workspace's Loading page island could flash in succession.
- Document islands inherited a 220 ms animation starting at opacity zero. Mounting and revealing document surfaces could restart that fade, causing visible blinking even after the state handoff.

These are findings from the source and installed Inertia implementation, not a captured browser trace.

## Change

Successful app visits now register their page snapshot explicitly after committing tab identity and recording the URL. Initial page registration uses a layout effect so tab initialization and cache registration settle before paint.

The lightweight document page moved into `components/documents/document-page.tsx` and is imported directly by the retained workspace and iframe route. The heavy editor still loads lazily through the existing loader. There is no second Suspense boundary around the document header.

A cached destination document becomes visible as soon as its app tab is selected, independent of the intermediate Inertia URL. When the destination is not cached, the workspace retains the matching outgoing document surface while the request completes, with editing and document shortcuts disabled on that outgoing surface. If the document response is present before its cache registration, its actual header and existing read-only content preview are available rather than a blank page or generic loading island. The ordinary page remains visible for uncached non-document handoffs.

Closed outgoing document snapshots remain protected from deferred cache cleanup until their replacement exists. The document island no longer fades from opacity zero. Existing document previews, autosave, close guards, split panes, canonical content, and backend routes remain in use.

## Library choice

No new dependency or upgrade. This is a regression fix using the already-reviewed React/Inertia approach. A new caching or animation package would not fix the ordering mismatch. Directly importing the lightweight surface removes an unnecessary asynchronous boundary; the editor remains split out.

The tradeoff is that the shell now imports the document header and its existing helper modules. The Vite/Inertia automatic page glob also lists those helpers as dynamic imports, so the production build reports ineffective dynamic import warnings for the crop dialog, media menu, database property header, and editor loader. Their static imports intentionally keep the header available without a second loading stage. The heavy `document-editor` remains a deferred asset. No route resolver or broad helper-file migration was added in this focused fix.

## Validation

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 249 formatted files, 186 linted files; no warnings/errors.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS, final build 7.44 seconds. Existing large-chunk warnings and the static/dynamic helper warnings described above remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instructions.
- The required in-app Browser remains unavailable; no interactive visual verification or instant-latency measurement was performed.

No migrations, persisted content changes, backend changes, or commits were created. The original stress document was not edited.

## Manual checklist

Hard-reload once to load the rebuilt assets. Use disposable documents for edits.

1. **Opening without refresh:** from workspace home, open the huge `test` document, go home, and open another document in the same app tab. Expected: each document appears on the first navigation; refreshing is not necessary; no blank content island or generic Loading page/Loading document section flashes.
2. **New app tab:** Ctrl+click a document or use Open in new tab. Repeat with a second document. Expected: correct selected tab, URL, header, and body appear without the cache-registration failure. Switch back and verify the original tab's document.
3. **Warm switches:** visit the huge document and a short document once, then switch repeatedly. Expected: the destination document remains fully visible through the local Inertia handoff; no fade from transparent, intermediate blank frame, opening preview, or generic loading section. Scroll positions and undo history remain available.
4. **Unvisited restored tab:** reload with several existing tabs. Throttle the Network and select a tab not yet visited in this page session. Expected: the outgoing content stays visible while loading, with its document editing disabled; it is replaced by the destination content when available. A first editor load may still use the existing read-only content preview. Switching among cached documents should not use this first-load path.
5. **Saved close:** close the active huge document with a visited destination, then repeat with an unvisited restored destination. Expected: the tab disappears promptly; content does not go blank during destination preparation; the outgoing closed editor is released after its replacement appears. Closing an inactive document must not disturb the visible document.
6. **Direct reload and cold cache:** load a document URL directly, with cache disabled and a slow connection. Expected: header/content preview remain available while the editor downloads; no extra generic loading island; one actual editable editor appears. The preview is read-only until readiness.
7. **Saving and history:** edit a disposable large document, switch away/back, wait for Saved, and verify after reload. Try closing before Saved. Expected: edits persist and pending-save protection remains. Exercise in-app Back and browser Back/Forward. Expected: correct document and URL with no permanent blank surface.
8. **Splits and appearance:** split two Saved documents, switch groups/ordinary tabs, and end the split after Saved. Expected: correct surfaces and saved content. Repeat normal document navigation in Light/Dark and reduced motion. Expected: no document fade/blink in any mode.

First document downloads and editor construction still take time. This fix keeps content visible through that work; it does not establish a numerical instant-opening guarantee. Read-only initial previews can differ from the final editor's complete formatting.

Suggested commit: `fix(navigation): prevent blank document handoffs and tab blinking`

Remain in Phase 5 for manual review.
