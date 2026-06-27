import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function WardenHeader({ selectedIds, wardens, openEditWardenModal, handleBulkStatusClick }) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('warden_management')}</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Manage all hostel wardens</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2">
                        <button
                            onClick={() => handleBulkStatusClick(true)}
                            className="px-3 py-2 bg-success/10 text-success border border-success/20 hover:bg-success/20 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            Active ({selectedIds.length})
                        </button>
                        <button
                            onClick={() => handleBulkStatusClick(false)}
                            className="px-3 py-2 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            Inactive ({selectedIds.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
