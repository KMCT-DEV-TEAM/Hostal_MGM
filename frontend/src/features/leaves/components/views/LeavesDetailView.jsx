import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Calendar, Clock, Building, User, ArrowLeftToLine } from 'lucide-react';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { formatDateReadable } from '@/utils/formatters';
import LeaveStatusBadge from '../badges/LeaveStatusBadge';
import LeaveReturnBadge from '../badges/LeaveReturnBadge';

export default function LeavesDetailView({
    passesData,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isHomePass,
    isWarden,
    isAdmin,
    passType,
    selectedHostel,
    onRowClick,
    onUpdateStatus,
    onUpdateReturn,
    onExport,
    onFilterClick,
    hasActiveFilters,
    page,
    setPage,
    pagination
}) {
    const navigate = useNavigate();

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, value: null, type: null });

    const handleConfirm = () => {
        if (confirmModal.type === 'status') {
            onUpdateStatus(confirmModal.id, confirmModal.value);
        } else if (confirmModal.type === 'return') {
            onUpdateReturn(confirmModal.id, confirmModal.value);
        }
        setConfirmModal({ isOpen: false, id: null, value: null, type: null });
    };

    const getStudentName = (r) => r.studentInfo?.name || r.studentName || 'Unknown';

    const getReturnStatus = (r) => {
        if (r.returnTracking?.returnedAt) {
            return r.returnTracking.returnStatus === 'late' ? 'Returned (Late)' : 'Returned (On Time)';
        }
        if (r.returnTracking?.leftHostelAt) return 'Left (Pending Return)';
        return '-----';
    };

    const statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    const getReturnOptions = (status) => {
        if (status === 'Left (Pending Return)') return [{ label: 'Mark Returned', value: 'Returned' }];
        return [{ label: 'Mark Left', value: 'Left' }];
    };

    const isRoomCol = !!selectedHostel || isWarden || isAdmin;

    const columns = [
        {
            key: "student",
            header: "Student",
            type: "user",
            titleAccessor: (r) => getStudentName(r),
            avatarAccessor: (r) => getStudentName(r),
        },
        {
            key: "location",
            header: isRoomCol ? "Room No" : "Hostel",
            renderCell: (r) => {
                if (isRoomCol) return <span className="font-medium text-gray-600">{r.studentInfo?.roomNumber || '--'}</span>;
                return (
                    <span
                        className="text-[#0A437A] font-semibold hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostelInfo?._id || r.hostelId?._id || r.hostel)}`);
                        }}
                    >
                        {r.hostelInfo?.name || r.hostelId?.name || r.hostel}
                    </span>
                );
            }
        },
        {
            key: "date",
            header: isHomePass ? "Leave Period" : "Date",
            accessor: (r) => isHomePass ? `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}` : formatDateReadable(r.fromDate || r.date),
        },
        {
            key: "type",
            header: isHomePass ? "Days" : "Type",
            accessor: (r) => isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : r.type || r.outPassCategory,
            renderCell: (r) => <span className="capitalize text-gray-500">{isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : r.type || r.outPassCategory}</span>
        },
        ...(isHomePass ? [] : [
            {
                key: "out",
                header: "Out",
                accessor: (r) => r.outTime || '--',
            },
            {
                key: "in",
                header: "In",
                accessor: (r) => r.expectedReturnTime || r.returnTime || '--',
            }
        ]),
        {
            key: "status",
            header: "Status",
            renderCell: (r) => {
                if (isAdmin && r.status === 'pending_admin') {
                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Dropdown
                                value=""
                                placeholder="Take Action"
                                onChange={(val) => {
                                    if (val) {
                                        setConfirmModal({ isOpen: true, id: r._id || r.id, value: val, type: 'status' });
                                    }
                                }}
                                options={[
                                    { value: 'Approved', label: 'Approve' },
                                    { value: 'Rejected', label: 'Reject' }
                                ]}
                                minWidth="min-w-[110px]"
                                triggerClassName="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm rounded-md"
                            />
                        </div>
                    );
                }
                return <LeaveStatusBadge status={r.status} />;
            }
        },
        {
            key: "return",
            header: "Return",
            renderCell: (r) => {
                if (isWarden && r.status === 'approved') {
                    const currentReturnStatus = getReturnStatus(r);
                    const isPendingReturn = currentReturnStatus === 'Left (Pending Return)';
                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setConfirmModal({ isOpen: true, id: r._id || r.id, value: isPendingReturn ? 'Returned' : 'Left', type: 'return' })}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors shadow-sm ${isPendingReturn ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                            >
                                {isPendingReturn ? 'Mark Returned' : 'Mark Left'}
                            </button>
                        </div>
                    );
                }
                return <LeaveReturnBadge returnTracking={r.returnTracking} />;
            }
        }
    ];

    const cardConfig = {
        avatar: (r) => getStudentName(r).substring(0, 2),
        title: (r) => getStudentName(r),
        subtitle: (r) => isRoomCol ? (r.studentInfo?.roomNumber || 'Room --') : (r.hostelInfo?.name || r.hostelId?.name || r.hostel),
        status: (r) => {
            if (isAdmin && r.status === 'pending_admin') {
                return {
                    text: 'Pending',
                    color: 'yellow',
                    actions: [
                        {
                            label: 'Approve',
                            color: 'green',
                            onClick: () => setConfirmModal({ isOpen: true, id: r._id || r.id, value: 'Approved', type: 'status' })
                        },
                        {
                            label: 'Reject',
                            color: 'red',
                            onClick: () => setConfirmModal({ isOpen: true, id: r._id || r.id, value: 'Rejected', type: 'status' })
                        }
                    ]
                };
            }
            if (isWarden && r.status === 'approved') {
                const currentReturnStatus = getReturnStatus(r);
                const isPendingReturn = currentReturnStatus === 'Left (Pending Return)';
                return {
                    text: r.status.replace('_', ' '),
                    color: 'green',
                    actions: [
                        {
                            label: isPendingReturn ? 'Mark Returned' : 'Mark Left',
                            color: isPendingReturn ? 'green' : 'blue',
                            onClick: () => setConfirmModal({ isOpen: true, id: r._id || r.id, value: isPendingReturn ? 'Returned' : 'Left', type: 'return' })
                        }
                    ]
                };
            }
            return {
                text: r.status ? r.status.replace('_', ' ') : 'pending',
                color: r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'pending_admin' ? 'yellow' : 'orenge'
            };
        },
        time: (r) => !isHomePass ? `${r.outTime || '--'} - ${r.expectedReturnTime || r.returnTime || '--'}` : formatDateReadable(r.createdAt || r.date),
        fields: [
            { icon: Calendar, accessor: (r) => isHomePass ? `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}` : formatDateReadable(r.fromDate || r.date) },
            { icon: User, accessor: (r) => isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : (r.type || r.outPassCategory) },
            {
                icon: ArrowLeftToLine,
                accessor: (r) => {
                    if (!r.returnTracking?.returnStatus && !isWarden) return null;
                    return getReturnStatus(r);
                }
            }
        ]
    };

    const toolbarEndSlot = (
        <button
            type="button"
            onClick={onFilterClick}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shadow-sm md:shadow-none shrink-0 flex items-center justify-center ${hasActiveFilters ? 'bg-[#0A437A] text-white hover:bg-[#0A437A]/90' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-10 w-10'}`}
            title="Filter leaves"
        >
            <Filter className="w-4 h-4" />
        </button>
    );

    return (
        <>
            <DataView
                pageScrollMode={true}
                className="h-full border-none shadow-none"
                data={passesData}
                columns={columns}
                cardConfig={cardConfig}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search records..."
                onRowClick={(item) => onRowClick(item)}
                toolbarEndSlot={toolbarEndSlot}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination?.totalRecords || 0}
                totalPages={pagination?.totalPages || 1}
                emptyText="No leave records matching the active filters."
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, value: null, type: null })}
                onConfirm={handleConfirm}
                title={confirmModal.type === 'status' ? 'Update Leave Status' : 'Update Return Status'}
                message={`Are you sure you want to mark this leave as ${confirmModal.value}?`}
                confirmText="Confirm Update"
            />
        </>
    );
}
