import { useBackgroundPreferences } from './background-preferences';
import { WallpaperDialog } from './wallpaper-dialog';

export function BackgroundSettings() {
    const { pauseAnimations, setPauseAnimations } = useBackgroundPreferences();

    return (
        <div className="space-y-5">
            <WallpaperDialog />
            <div className="appearance-option-row">
                <div>
                    <p className="text-sm font-medium">
                        Pause animated wallpapers
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Show a still color. System reduced motion also pauses
                        them.
                    </p>
                </div>
                <label className="appearance-switch">
                    <input
                        type="checkbox"
                        checked={pauseAnimations}
                        onChange={(event) =>
                            setPauseAnimations(event.target.checked)
                        }
                        aria-label="Pause animated wallpapers"
                    />
                    <span aria-hidden="true" />
                </label>
            </div>
        </div>
    );
}
