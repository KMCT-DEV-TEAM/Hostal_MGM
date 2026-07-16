import { useEffect } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";

export function useLayoutConfig(config = {}) {
    const setHeader = useLayoutStore(s => s.setHeader);
    const setFooter = useLayoutStore(s => s.setFooter);
    const resetLayout = useLayoutStore(s => s.resetLayout);

    // Deep comparison primitives to prevent infinite loops when config objects are recreated inline
    const headerVariant = config.header?.variant ?? "dashboard";
    const headerTitle = config.header?.title ?? "";
    const headerShowBack = config.header?.showBack ?? false;
    const footerVisible = config.footer?.visible ?? true;

    useEffect(() => {
        if (config.header) {
            setHeader({
                variant: headerVariant,
                title: headerTitle,
                showBack: headerShowBack,
            });
        }
        
        if (config.footer !== undefined) {
            setFooter({ visible: footerVisible });
        }

        return () => {
            resetLayout();
        };

    }, [
        headerVariant,
        headerTitle,
        headerShowBack,
        footerVisible,
        setHeader,
        setFooter,
        resetLayout
    ]);
}