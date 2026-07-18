import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function MaintenanceStaffHeader() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4 flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('Maintenance Staff')}</h1>
                <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">{t('Manage maintenance staff responsible for handling repair tasks.')}</p>
            </div>
        </div>
    );
}
