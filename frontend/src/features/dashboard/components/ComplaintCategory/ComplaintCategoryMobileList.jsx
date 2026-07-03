import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';

const ComplaintCategoryMobileList = ({
    complaintCategories,
    loading,
    error,
    openModal,
    setSelectedCategoryDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick
}) => {
    const { t } = useTranslation();

    const renderBody = (c) => (
        <>
            <MobileRow label="Id" value={(c.categoryId || c._id.substring(c._id.length - 6)).toUpperCase()} />
            <MobileRow label="Desc." value={c.description || 'N/A'} />
            <MobileRow 
                label={t('status')} 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                            value={c.isActive ? "Active" : "Inactive"}
                            onChange={() => handleStatusChangeClick && handleStatusChangeClick(c._id, c.isActive)}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${c.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                        />
                    </div>
                } 
            />
        </>
    );

    return (
        <MobileList
            items={complaintCategories}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={(c) => openModal('edit', c)}
            canSelect={true}
            canEdit={true}
            emptyText={t('no_records_found')}
            titleFn={(c) => c.name}
            renderBody={renderBody}
            onViewDetails={(c) => {
                setSelectedCategoryDetail(c);
                setView('detail');
            }}
        />
    );
};

export default ComplaintCategoryMobileList;
