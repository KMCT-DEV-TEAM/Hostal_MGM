import { useEffect } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";

export function useLayoutConfig(config = {}) {

    const {
        footer = true,
        header = true,
    } = config;

    const setShowFooter = useLayoutStore(s => s.setShowFooter);
    const setShowHeader = useLayoutStore(s => s.setShowHeader);
    const resetLayout = useLayoutStore(s => s.resetLayout);

    useEffect(() => {

        setShowFooter(footer);
        setShowHeader(header);

        return () => {
            resetLayout();
        };

    }, [
        footer,
        header,
        setShowFooter,
        setShowHeader,
        resetLayout
    ]);

}