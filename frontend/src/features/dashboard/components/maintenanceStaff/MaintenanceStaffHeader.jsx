import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { List, LayoutGrid } from 'lucide-react';

export default function MaintenanceStaffHeader({ showKPIs, setShowKPIs }) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4 flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('Maintenance Staff')}</h1>
                <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">{t('Manage maintenance staff responsible for handling repair tasks.')}</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="hidden md:flex items-center self-end sm:self-auto mt-4 sm:mt-0">
                    <button
                        onClick={() => setShowKPIs(!showKPIs)}
                        className="flex items-center gap-2 p-2 text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        {showKPIs ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
