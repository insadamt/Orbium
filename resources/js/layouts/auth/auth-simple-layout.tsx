import { Link } from '@inertiajs/react';
import { AppBackground } from '@/backgrounds/app-background';
import { useSurfaceStyle } from '@/backgrounds/surface-preferences';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const surfaceStyle = useSurfaceStyle();

    return (
        <div
            className={`orbium-shell surface-${surfaceStyle} flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10`}
        >
            <AppBackground />
            <div className="orbium-auth-content w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                            aria-label="Orbium home"
                        >
                            <div className="mb-1 flex size-20 items-center justify-center">
                                <AppLogoIcon className="size-20" />
                            </div>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
