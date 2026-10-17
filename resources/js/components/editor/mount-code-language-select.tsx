import { mountAppSelect } from '@/components/ui/mount-app-select';
import { codeLanguageSearchKeywords } from './code-languages';
import { codeLanguageIconDetails } from './code-language-icons';

function CodeLanguageOptionIcon({ language }: { language: string }) {
    const details = codeLanguageIconDetails(language);
    return (
        <svg
            width="24"
            height="24"
            viewBox={details.viewBox}
            aria-hidden="true"
            className="size-6 shrink-0"
        >
            <path
                d={details.path}
                fill={details.outlined ? 'none' : 'currentColor'}
                stroke={details.outlined ? 'currentColor' : undefined}
                strokeWidth={details.outlined ? 1.8 : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function mountCodeLanguageSelect(select: HTMLSelectElement) {
    return mountAppSelect(select, {
        searchPlaceholder: 'Search languages…',
        getSearchKeywords: codeLanguageSearchKeywords,
        triggerClassName: 'focus-visible:bg-accent/50 focus-visible:ring-0',
        renderOptionIcon: (language) => (
            <CodeLanguageOptionIcon language={language} />
        ),
    });
}
