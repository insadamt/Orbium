# Workspace navigation mode — 2026-10-29

## Scope

Adds a second navigation layout under **Settings → Appearance → Navigation layout**. Classic remains the default and its existing floating controls, tabs, pages, and navigation behavior are preserved.

Workspace mode uses the existing navigation state and document retention implementation. No data migrations, new dependencies, or new endpoints are introduced. The existing authenticated `/workspaces/{workspace}/tree` endpoint now includes existing node-icon fields so the sidebar matches the explorer.

## Behavior

- A persistent, resizable full-height sidebar contains the workspace selector, Home, Search Master, Folder Explorer, Library, Statistics, Trash, and Settings.
- The tree loads on demand from the existing authorized workspace endpoint (home pages can provide the already-loaded tree); folder rows expand/collapse without navigating; clicking titles navigates through the existing tab engine. Databases appear as standalone leaves, not expanded records.
- Expanded folder IDs and scroll offsets are stored separately per user/workspace in browser storage. Width and collapse state are browser-local settings. The current node's ancestors are revealed when opening its page.
- Tree branches render no descendants while collapsed and initially cap visible siblings to 160, with an explicit Show more action. Existing node move endpoints handle drag/drop into folders or root; the backend remains responsible for rejecting invalid destinations.
- The adaptive tab bar is centered in the **content area**. By default it is a floating overlay revealed at the top edge; a pin control converts it into a reserved integrated top row. Unpinning restores auto-hide. Alt+Shift+T reveals the bar for keyboard users. The original tabs (including pin, reorder, history, and split) are reused.
- Content remains in the existing page components, with Workspace-specific full-height shell styling and bounded page spacing. The sidebar does not replace Library, Statistics, Boards, or Documents with embedded widgets.
- Collapsing the sidebar preserves the user's expanded folders and width; the tab rail includes a button to reopen it. Mobile uses an overlay sidebar rather than shrinking the content to near-zero width.
- The top-level `+` within tabs continues opening workspace Home in a new tab. Sidebar content creation uses the existing CreateNodeForm.

## Manual acceptance (no automated tests per AGENTS.md)

1. Settings → Appearance: switch to Workspace. Verify the full-height sidebar appears without closing open tabs. Switch back to Classic and confirm its previous layout returns.
2. In two different workspaces, expand nested folders and open a child document. Verify auto-expanded parents, remembered expansion/scroll after reload, and separate state for each workspace.
3. Verify folder arrow expands but name navigates; Database opens a page without listing its records; Document and Board open in the shared tab engine. Confirm custom emoji and uploaded icons appear.
4. Drag a document to another folder and then back to Explorer/root. Verify the server accepts the move and tree refreshes. Try an invalid cyclic move: server must reject it.
5. Move cursor to the top of the content area. Tabs should appear without shifting the page. Leave the tab rail to hide it. Pin to reserve a top row; unpin to restore overlay behavior.
6. Collapse and reopen sidebar; adjust width using pointer and Left/Right keyboard arrows on resize separator. Verify width and visibility after reload.
7. Open Library, Statistics, Trash, and Settings as full pages; verify the sidebar remains available and each content area occupies the remaining height. Confirm Boards can still enter fullscreen.
8. Verify tab close/pin/reorder/history/split features; test large folders with Show more and ensure collapsed branches do not render descendants.
9. Test light/dark and normal/frosted surfaces, narrower screens, reduced-motion preference, keyboard focus, and Escape on dropdowns/dialogs.

## Verification

The connected GitHub integration was used to inspect source and create the change. It cannot run the Laravel/Vite runtime. Before deploying, run `npm run types:check`, `npm run lint`, `npm run build` and a visual browser walkthrough. These checks have not been claimed as passed.
