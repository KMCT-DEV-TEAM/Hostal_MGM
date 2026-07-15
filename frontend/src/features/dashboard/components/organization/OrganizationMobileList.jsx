import React from 'react';
import MobileList, { MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Mail, Phone } from 'lucide-react';
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
    error,
    currentPage,
    totalPages,
    hasMore,
    onLoadMore,
    ...rest
}) => {
    const { t } = useTranslation();

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
            currentPage={currentPage}
            totalPages={totalPages}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            emptyText={t('no_org_found')}
            iconFn={(o) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {o.name ? o.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => (
                <>
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{o.email || 'N/A'}</span>
                </>
            )}
            rightTopFn={(o) => (
                <>
                    <Phone className="w-3 h-3" />
                    <span>{o.phone || 'N/A'}</span>
                </>
            )}
            statusBadgeFn={(o) => (
                <MobileCardStatusBadge
                    status={o.isActive ? t('active') : t('inactive')}
                    dotColorClass={o.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={o.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={o.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(o) => {
                setSelectedOrganizationDetail(o);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default OrganizationMobileList;
