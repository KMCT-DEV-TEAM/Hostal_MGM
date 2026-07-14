import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Building2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';

const HostelMobileList = ({
    hostels,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedHostelDetail,
    setView,
    openEditHostelModal,
    handleStatusChangeClick,
    loading,
    error
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const renderBody = (hostel) => {
        const canEdit = user?.role === 'super_admin' || 
                        hostel.adminId?._id === user?._id || 
                        hostel.adminId?._id === user?.id || 
                        hostel.adminId === user?._id || 
                        hostel.adminId === user?.id;

        return (
        <>
            <MobileRow label={t('type')} value={<span className="capitalize">{hostel.hosteltype}</span>} />
            <MobileRow label={t('capacity')} value={hostel.capacity} />
            <MobileRow label="Students" value={hostel.studentsCount || 0} />
            <MobileRow label={t('phone')} value={hostel.phone || 'N/A'} />
            <MobileRow label={t('location')} value={hostel.location || 'N/A'} />
            <MobileRow 
                label={t('status')} 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        {canEdit ? (
                            <Dropdown
                                minWidth=""
                                options={[
                                    { value: "Active", label: "Active" },
                                    { value: "Inactive", label: "Inactive" }
                                ]}
                                value={hostel.isActive ? "Active" : "Inactive"}
                                onChange={() => handleStatusChangeClick(hostel._id, hostel.isActive)}
                                triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${hostel.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                            />
                        ) : (
                            <span className={`inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-regular border rounded-lg ${hostel.isActive ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-danger border-red-200'}`}>
                                {hostel.isActive ? 'Active' : 'Inactive'}
                            </span>
                        )}
                    </div>
                } 
            />
        </>
        );
    };

    return (
        <MobileList
            items={hostels}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            isSelectableFn={(hostel) => user?.role === 'super_admin' || hostel.adminId?._id === user?._id || hostel.adminId?._id === user?.id || hostel.adminId === user?._id || hostel.adminId === user?.id}
            onEdit={openEditHostelModal}
            canSelect={true}
            canEdit={(hostel) => user?.role === 'super_admin' || hostel.adminId?._id === user?._id || hostel.adminId?._id === user?.id || hostel.adminId === user?._id || hostel.adminId === user?.id}
            emptyText={t('no_hostel_found')}
            iconFn={(hostel) => (
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-500" />
                </div>
            )}
            titleFn={(hostel) => hostel.name}
            subtitleFn={(hostel) => <span className="capitalize">{hostel.hosteltype} | {hostel.capacity} capacity</span>}
            rightTopFn={(hostel) => hostel.studentsCount ? `${hostel.studentsCount} Students` : null}
            statusBadgeFn={(hostel) => (
                <MobileCardStatusBadge
                    status={hostel.isActive ? 'Active' : 'Inactive'}
                    dotColorClass={hostel.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={hostel.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={hostel.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            renderBody={renderBody}
            onViewDetails={(hostel) => {
                setSelectedHostelDetail(hostel);
                setView('detail');
            }}
        />
    );
};

export default HostelMobileList;
