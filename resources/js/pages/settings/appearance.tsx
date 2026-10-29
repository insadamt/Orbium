import { Head } from '@inertiajs/react';
import { BackgroundSettings } from '@/backgrounds/background-settings';
import { SurfaceSettings } from '@/backgrounds/surface-settings';
import AppearanceTabs from '@/components/appearance-tabs';
import { WorkspaceNavigationSettings } from '@/components/navigation/workspace-navigation-settings';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="max-w-[680px] space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="Choose how Orbium looks on this browser"
                />
                <AppearanceTabs />
                <WorkspaceNavigationSettings />
                <SurfaceSettings />
                <BackgroundSettings />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
