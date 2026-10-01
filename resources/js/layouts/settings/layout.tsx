import { Link } from '@inertiajs/react';
import { useEffect, type PropsWithChildren } from 'react';
import { usePageSearch } from '@/components/navigation/page-search';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

const settingsSections = [
    {
        title: 'Profile',
        href: editProfile(),
        searchText: 'profile name email account',
    },
    {
        title: 'Security',
        href: editSecurity(),
        searchText: 'security password current new confirmation',
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        searchText:
            'appearance theme light dark system backgrounds animated upload image ghost fibers molten metal',
    },
    {
        title: 'Workspaces',
        href: '/settings/workspaces',
        searchText:
            'workspaces create rename reorder trash restore delete manage',
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isWorkspaceSection = isCurrentOrParentUrl('/settings/workspaces');
    const search = usePageSearch();
    const normalizedQuery = search.query.trim().toLocaleLowerCase();
    const visibleSections = settingsSections.filter((section) =>
        section.searchText.includes(normalizedQuery),
    );
    const currentSectionMatches = settingsSections.some(
        (section) =>
            isCurrentOrParentUrl(section.href) &&
            visibleSections.includes(section),
    );

    useEffect(() => {
        search.setResultCount(normalizedQuery ? visibleSections.length : null);
    }, [normalizedQuery, visibleSections.length, search.setResultCount]);

    return (
        <div
            className={`floating-body-island floating-settings-island mx-auto ${isWorkspaceSection ? 'max-w-[1100px]' : 'max-w-[980px]'}`}
        >
            <h1 className="mb-7 text-2xl font-semibold tracking-tight">
                Settings
            </h1>
            <nav aria-label="Settings" className="floating-settings-nav">
                {visibleSections.map((section) => (
                    <Link
                        key={section.title}
                        href={section.href}
                        className="floating-settings-link"
                        aria-current={
                            isCurrentOrParentUrl(section.href)
                                ? 'page'
                                : undefined
                        }
                    >
                        {section.title}
                    </Link>
                ))}
            </nav>
            {visibleSections.length === 0 && (
                <p role="status" className="floating-no-results">
                    No settings match this search.
                </p>
            )}
            {(!normalizedQuery || currentSectionMatches) && (
                <div
                    className={`floating-settings-content ${isWorkspaceSection ? 'max-w-none' : ''}`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
