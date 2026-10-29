// Appearance setting for switching between the existing and full-height navigation.
import { Columns3, PanelsTopLeft } from 'lucide-react';
import {
    updateWorkspaceNavigationPreferences,
    useWorkspaceNavigationPreferences,
    type NavigationMode,
} from './workspace-navigation-preferences';

const modes = [
    {
        id: 'classic',
        title: 'Classic',
        description: 'Floating controls, centered tabs, and workspace cards.',
        Icon: PanelsTopLeft,
    },
    {
        id: 'workspace',
        title: 'Workspace',
        description: 'Full-height sidebar with adaptive tabs and focused pages.',
        Icon: Columns3,
    },
] as const;

export function WorkspaceNavigationSettings() {
    const { mode } = useWorkspaceNavigationPreferences();

    return (
        <section
            className="space-y-4 border-t border-border pt-6"
            aria-labelledby="navigation-mode-heading"
        >
            <div>
                <h2 id="navigation-mode-heading" className="text-lg font-medium">
                    Navigation layout
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Switch layouts without changing your pages or open tabs.
                    Saved for this browser.
                </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Navigation layout">
                {modes.map(({ id, title, description, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={mode === id}
                        onClick={() =>
                            updateWorkspaceNavigationPreferences({
                                mode: id as NavigationMode,
                            })
                        }
                        className="appearance-choice flex min-h-24 items-start gap-3 rounded-xl px-4 py-3 text-left"
                    >
                        <Icon size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
                        <span>
                            <span className="block font-medium">{title}</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                                {description}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
