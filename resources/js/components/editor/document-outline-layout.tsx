import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { attachFloatingOutlinePositioning } from './floating-outline-position';
import { useDocumentTab } from '@/components/navigation/document-tab-context';

const OutlinePanelContext = createContext<{
    panelHost: HTMLElement | null;
    title: string;
}>({ panelHost: null, title: '' });

export function useOutlinePanelHost() {
    return useContext(OutlinePanelContext);
}

export function DocumentOutlineLayout({
    children,
    title,
}: {
    children: ReactNode;
    title: string;
}) {
    const { visible } = useDocumentTab();
    const [panelHost, setPanelHost] = useState<HTMLElement | null>(null);
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!visible || !panelHost || !container.current) return;
        return attachFloatingOutlinePositioning(panelHost, container.current);
    }, [visible, panelHost]);
    return (
        <OutlinePanelContext.Provider value={{ panelHost, title }}>
            <div ref={container} className="document-outline-container">
                {children}
                {typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            ref={setPanelHost}
                            className="document-outline-slot"
                            hidden={!visible}
                        />,
                        (window.frameElement?.ownerDocument ?? document).body,
                    )}
            </div>
        </OutlinePanelContext.Provider>
    );
}
