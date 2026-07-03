import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
import { useTranslation } from '@/hooks/useTranslation';

const OrganizationMobileList = ({
    orgs,
    isAdmin,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedOrganizationDetail,
    setView,
    openModal,
    handleStatusChangeClick,
    loading,
    error
}) => {
    const { t } = useTranslation();

    const renderBody = (o) => (
        <>
            <MobileRow label={t('email')} value={o.email || 'N/A'} />
            <MobileRow label={t('phone')} value={o.phone || 'N/A'} />
            <MobileRow 
                label={t('address')} 
                value={o.address ? (
                    <div className="flex flex-col w-full min-w-0 break-words">
                        {o.address.split(',').map((line, idx) => (
                            <span key={idx} className="break-words whitespace-pre-wrap">{line.trim()}</span>
                        ))}
                    </div>
                ) : 'N/A'} 
            />
            <MobileRow label="Students" value={o.studentsCount || 0} />
            <MobileStatusRow 
                isActive={o.isActive} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isAdmin && handleStatusChangeClick) handleStatusChangeClick(o._id, o.isActive);
                }} 
            />
        </>
    );

    return (
        <MobileList
            items={orgs}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={isAdmin ? undefined : (o) => openModal('edit', o)}
            canSelect={!isAdmin}
            canEdit={!isAdmin}
            emptyText={t('no_org_found')}
            titleFn={(o) => o.name}
            renderBody={renderBody}
            onViewDetails={(o) => {
                setSelectedOrganizationDetail(o);
                setView('detail');
            }}
        />
    );
};

export default OrganizationMobileList;
