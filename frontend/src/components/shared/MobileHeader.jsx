import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import MobileDashboardHeader from './MobileDashboardHeader';
import MobilePageHeader from './MobilePageHeader';

const MobileHeader = () => {
    const variant = useLayoutStore((state) => state.header.variant);

    switch (variant) {
        case "page":
            return <MobilePageHeader />;

        case "dashboard":
        default:
            return <MobileDashboardHeader />;
    }
};

export default MobileHeader;
