import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function HostelHeader() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('hostel_management')}</h1>
                <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage all hostels</p>
            </div>
        </div>
    );
}
