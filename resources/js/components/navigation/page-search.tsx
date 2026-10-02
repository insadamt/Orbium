import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

type SearchStep = { id: number; previous: boolean; query: string };
type PageSearchState = {
    open: boolean;
    query: string;
    resultCount: number | null;
    searchStep: SearchStep;
    openSearch: () => void;
    closeSearch: () => void;
    setQuery: (query: string) => void;
    setResultCount: (count: number | null) => void;
    stepToMatch: (previous: boolean) => void;
};

const PageSearchContext = createContext<PageSearchState | null>(null);

export function PageSearchProvider({
    children,
    routePath,
}: {
    children: ReactNode;
    routePath: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [resultCount, setResultCount] = useState<number | null>(null);
    const [searchStep, setSearchStep] = useState<SearchStep>({
        id: 0,
        previous: false,
        query: '',
    });

    useEffect(() => {
        setOpen(false);
        setQuery('');
        setResultCount(null);
        setSearchStep({ id: 0, previous: false, query: '' });
    }, [routePath]);

    function closeSearch() {
        setOpen(false);
        setQuery('');
        setResultCount(null);
    }

    return (
        <PageSearchContext.Provider
            value={{
                open,
                query,
                resultCount,
                searchStep,
                openSearch: () => setOpen(true),
                closeSearch,
                setQuery,
                setResultCount,
                stepToMatch: (previous) =>
                    setSearchStep((step) => ({
                        id: step.id + 1,
                        previous,
                        query,
                    })),
            }}
        >
            {children}
        </PageSearchContext.Provider>
    );
}

export function usePageSearch(): PageSearchState {
    const search = useContext(PageSearchContext);
    if (!search) throw new Error('Page search requires its provider.');
    return search;
}
