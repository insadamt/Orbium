import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';

export function BoardHelpDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Canvas controls</DialogTitle>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <dt>Select / move objects</dt>
                    <dd>Choose Select, then click or drag an object</dd>
                    <dt>Move around</dt>
                    <dd>Hand tool, scroll, middle drag, or Space + drag</dd>
                    <dt>Zoom at pointer</dt>
                    <dd>Ctrl/Cmd + scroll or pinch</dd>
                    <dt>Create a block</dt>
                    <dd>
                        Choose Text, Image or Add, then click to place. Enter
                        places it at the view center.
                    </dd>
                    <dt>Draw / highlight</dt>
                    <dd>
                        Choose Draw, then Pen or Highlighter. Pick ink and
                        width, then drag; taps draw dots. Smoothing offers Off,
                        Light and Strong. Click Draw again to hide settings.
                        Select or Escape returns to Select.
                    </dd>
                    <dt>Path Pen</dt>
                    <dd>
                        Draw → Path Pen. Click corners; Shift constrains angles.
                        Enter, double-click or Finish saves one path. Click the
                        first point to close. Backspace removes a point; Escape
                        cancels the unfinished path.
                    </dd>
                    <dt>Erase drawings</dt>
                    <dd>
                        Choose Eraser and a size, then drag across ink. Only
                        touched sections are removed; Undo restores one drag.
                    </dd>
                    <dt>Style an existing drawing</dt>
                    <dd>
                        Choose Select and click a drawing. Use Drawing color and
                        Drawing width in its floating toolbar.
                    </dd>
                    <dt>Select several</dt>
                    <dd>
                        Shift/Ctrl/Cmd + click, or drag empty space with Select
                    </dd>
                    <dt>Edit / finish</dt>
                    <dd>
                        Double-click a block or select it and press Enter. Enter
                        edits, Escape or Ctrl/Cmd+Enter finishes.
                    </dd>
                    <dt>Writing commands</dt>
                    <dd>
                        Type / in empty writing to choose a block. #, ##, ###,
                        -, 1., &gt;, or [] followed by Space changes text style.
                    </dd>
                    <dt>Format text</dt>
                    <dd>
                        Select text for formatting. Ctrl/Cmd+B/I/U toggles
                        marks; Ctrl/Cmd+K edits links.
                    </dd>
                    <dt>Cancel</dt>
                    <dd>
                        Escape cancels the active gesture, placement or edit
                    </dd>
                    <dt>Arrange selection</dt>
                    <dd>
                        Smart guides snap edges/centers. Alt bypasses snapping.
                        Arrange aligns or distributes multiple objects.
                    </dd>
                    <dt>Properties</dt>
                    <dd>
                        Select an object and open Object properties for exact
                        position, size and text style.
                    </dd>
                    <dt>Move selection</dt>
                    <dd>Arrow keys move 1 unit; Shift moves 10</dd>
                    <dt>Resize selection</dt>
                    <dd>
                        Side handles or Alt + Left/Right change width. Corners
                        scale the whole block. Height follows content.
                    </dd>
                    <dt>Image proportions</dt>
                    <dd>
                        Corners scale the whole block; edges change its frame.
                        Shift resizes image frames freely
                    </dd>
                    <dt>Write lists</dt>
                    <dd>
                        Enter splits; Shift+Enter adds a line; Tab / Shift+Tab
                        indents / outdents. Enter on an empty item finishes.
                    </dd>
                    <dt>Table cells</dt>
                    <dd>
                        Tab / Shift+Tab moves between cells. Tab at the last
                        cell adds a row.
                    </dd>
                    <dt>Scroll content</dt>
                    <dd>
                        Edit a block to scroll inside it. Inactive previews pan
                        the canvas; media players retain their controls.
                    </dd>
                    <dt>Undo / redo</dt>
                    <dd>Ctrl/Cmd + Z / Shift + Z</dd>
                    <dt>Copy / cut / paste</dt>
                    <dd>Ctrl/Cmd + C / X / V on the canvas</dd>
                    <dt>Duplicate / delete</dt>
                    <dd>Ctrl/Cmd + D / Delete</dd>
                    <dt>Selection actions</dt>
                    <dd>Right-click an object or use Selection options</dd>
                    <dt>Touch</dt>
                    <dd>Tap to place; Hand pans; two fingers pan and zoom</dd>
                </dl>
            </DialogContent>
        </Dialog>
    );
}
