import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
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
        setSearchStep((step) =>
            step.id === 0 && step.query === ''
                ? step
                : { id: 0, previous: false, query: '' },
        );
    }, [routePath]);

    const closeSearch = useCallback(() => {
        setOpen(false);
        setQuery('');
        setResultCount(null);
    }, []);
    const openSearch = useCallback(() => setOpen(true), []);
    const stepToMatch = useCallback(
        (previous: boolean) =>
            setSearchStep((step) => ({
                id: step.id + 1,
                previous,
                query,
            })),
        [query],
    );
    const value = useMemo(
        () => ({
            open,
            query,
            resultCount,
            searchStep,
            openSearch,
            closeSearch,
            setQuery,
            setResultCount,
            stepToMatch,
        }),
        [
            open,
            query,
            resultCount,
            searchStep,
            openSearch,
            closeSearch,
            stepToMatch,
        ],
    );

    return (
        <PageSearchContext.Provider value={value}>
            {children}
        </PageSearchContext.Provider>
    );
}

export function usePageSearch(): PageSearchState {
    const search = useContext(PageSearchContext);
    if (!search) throw new Error('Page search requires its provider.');
    return search;
}
