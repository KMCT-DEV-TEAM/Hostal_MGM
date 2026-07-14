import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Globe } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
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
            <MobileRow 
                label={t('status')} 
                value={
                    isAdmin ? (
                        <div className={`inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-regular border rounded-md ${o.isActive ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-danger border-red-200'}`}>
                            {o.isActive ? t('active') : t('inactive')}
                        </div>
                    ) : (
                        <div onClick={(e) => e.stopPropagation()} className="w-full">
                            <Dropdown
                                minWidth=""
                                options={[
                                    { value: "Active", label: t('active') },
                                    { value: "Inactive", label: t('inactive') }
                                ]}
                                value={o.isActive ? "Active" : "Inactive"}
                                onChange={() => handleStatusChangeClick && handleStatusChangeClick(o._id, o.isActive)}
                                triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${o.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                            />
                        </div>
                    )
                } 
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
            iconFn={(o) => (
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-teal-500" />
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => o.email || o.phone || 'Organization'}
            rightTopFn={(o) => o.studentsCount ? `${o.studentsCount} Students` : null}
            statusBadgeFn={(o) => (
                <MobileCardStatusBadge
                    status={o.isActive ? t('active') : t('inactive')}
                    dotColorClass={o.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={o.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={o.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            renderBody={renderBody}
            onViewDetails={(o) => {
                setSelectedOrganizationDetail(o);
                setView('detail');
            }}
        />
    );
};

export default OrganizationMobileList;
