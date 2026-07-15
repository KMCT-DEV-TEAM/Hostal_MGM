import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Mail, Phone } from 'lucide-react';

const AdminMobileList = ({
    paginatedAdmins,
    openEditAdminModal,
    setSelectedAdminDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    loading,
    error,
    ...rest
}) => {

    return (
        <MobileList
            items={paginatedAdmins}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={openEditAdminModal}
            canSelect={true}
            canEdit={true}
            emptyText="No administrators match the selected filter."
            iconFn={(admin) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {admin.name ? admin.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(admin) => admin.name}
            subtitleFn={(admin) => (
                <>
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{admin.email || 'N/A'}</span>
                </>
            )}
            rightTopFn={(admin) => (
                <>
                    <Phone className="w-3 h-3" />
                    <span>{admin.phone || 'N/A'}</span>
                </>
            )}
            statusBadgeFn={(admin) => (
                <MobileCardStatusBadge
                    status={admin.isActive ? 'Active' : 'Inactive'}
                    dotColorClass={admin.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={admin.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={admin.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(admin) => {
                setSelectedAdminDetail(admin);
                setView('detail');
            }}
        {...rest}
        />
    );
};

export default AdminMobileList;