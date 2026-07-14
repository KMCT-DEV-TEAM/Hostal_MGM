import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Download } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { formatDateReadable } from '@/utils/formatters';
import LeaveStatusBadge from '../badges/LeaveStatusBadge';
import LeaveReturnBadge from '../badges/LeaveReturnBadge';
import InfoCard from '@/components/ui/InfoCard';

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
    const getStudentInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const getReturnStatus = (r) => {
        console.log('return status', r);
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

    const tableHeaders = useMemo(() => {
        const isRoomCol = !!selectedHostel || isWarden || isAdmin;
        const midCol = isRoomCol ? "Room No" : "Hostel";
        const dateCol = isHomePass ? "Leave Period" : "Date";
        const typeCol = isHomePass ? "Days" : "Type";

        const baseCols = ["Student", midCol, dateCol, typeCol];
        const outPassCols = isHomePass ? [] : ["Out", "In"];
        const statusCols = [{ label: "Status", align: "start" }, { label: "Return", align: "start" }];

        return [...baseCols, ...outPassCols, ...statusCols];
    }, [selectedHostel, isWarden, isAdmin, isHomePass]);


    return (
        <>
            <DataTable
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search"
                loading={loading}
                onRowClick={onRowClick}
                onExport={onExport}
                headers={tableHeaders}
                items={passesData}
                canSelect={false}
                emptyText="No leave records matching the active filters."
                renderRow={(r) => {
                    const studentName = getStudentName(r);
                    return (
                        <>
                            {/* Student initials and full name */}
                            <td className="p-4 flex items-center gap-3 font-bold text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                    {getStudentInitials(studentName)}
                                </div>
                                <span className="text-sm font-semibold">{studentName}</span>
                            </td>

                            {/* Room No (if drilldown/warden/admin) or Hostel name (if SuperAdmin aggregate view) */}
                            <td className="p-4 text-text-secondary font-medium">
                                {selectedHostel || isWarden || isAdmin ? (r.studentInfo?.roomNumber || '--') : (
                                    <span
                                        className="text-primary font-semibold hover:underline cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostelInfo?._id || r.hostelId?._id || r.hostel)}`);
                                        }}
                                    >
                                        {r.hostelInfo?.name || r.hostelId?.name || r.hostel}
                                    </span>
                                )}
                            </td>

                            {/* Period / Date */}
                            <td className="p-4 text-text-secondary lowercase">
                                {isHomePass ? `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}` : formatDateReadable(r.fromDate || r.date)}
                            </td>

                            {/* Days / Type */}
                            <td className="p-4 text-text-secondary capitalize">
                                {isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : r.type || r.outPassCategory}
                            </td>

                            {/* Times (Out pass only) */}
                            {!isHomePass && (
                                <>
                                    <td className="p-4 text-text-secondary">
                                        {r.outTime || '--'}
                                    </td>
                                    <td className="p-4 text-text-secondary">
                                        {r.expectedReturnTime || r.returnTime || '--'}
                                    </td>
                                </>
                            )}

                            {/* Inline Status Dropdown */}
                            <td className="p-4">
                                {isAdmin && r.status === 'pending_admin' ? (
                                    <Dropdown
                                        options={statusOptions}
                                        value="Pending"
                                        onChange={(val) => setConfirmModal({ isOpen: true, id: r._id || r.id, value: val, type: 'status' })}
                                        minWidth="w-[130px]"
                                        triggerClassName={`px-3 py-1.5 rounded-md text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-warning/10 border-warning/30 text-warning hover:bg-warning/20 w-[130px]`}
                                    />
                                ) : (
                                    <LeaveStatusBadge status={r.status} />
                                )}
                            </td>

                            {/* Inline Return Dropdown */}
                            <td className="p-4">
                                {isWarden && r.status === 'approved' ? (
                                    <Dropdown
                                        options={getReturnOptions(getReturnStatus(r))}
                                        value=""
                                        placeholder={getReturnStatus(r)}
                                        onChange={(val) => setConfirmModal({ isOpen: true, id: r._id || r.id, value: val, type: 'return' })}
                                        minWidth="w-[160px]"
                                        triggerClassName={`px-3 py-1.5 rounded-md text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-white border-gray-200 text-gray-700 hover:bg-gray-50 w-[160px]`}
                                    />
                                ) : (
                                    <LeaveReturnBadge returnTracking={r.returnTracking} />
                                )}
                            </td>
                        </>
                    );
                }}
                renderMobileItem={(r) => {
                    const studentName = getStudentName(r);
                    return (
                        <div className="mb-2">
                            <InfoCard
                                avatar={studentName}
                                title={studentName}
                                subtitle={selectedHostel || isWarden || isAdmin ? (r.studentInfo?.roomNumber || 'Room --') : (r.hostelInfo?.name || r.hostelId?.name || r.hostel)}
                                onClick={onRowClick ? () => onRowClick(r) : undefined}
                                status={{
                                    text: r.status ? r.status.replace('_', ' ') : 'pending',
                                    color: r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'pending_admin' ? 'yellow' : 'orenge'
                                }}
                                fields={[
                                    { label: "Date", value: isHomePass ? `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}` : formatDateReadable(r.fromDate || r.date) },
                                    { label: "Type/Duration", value: isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : (r.type || r.outPassCategory) },
                                    !isHomePass && { label: "Outing Time", value: `${r.outTime || '--'} - ${r.expectedReturnTime || r.returnTime || '--'}` },

                                    r.returnTracking?.returnStatus && {
                                        label: "Return Status",
                                        value: isWarden && r.status === 'approved' ? (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Dropdown
                                                    options={getReturnOptions(getReturnStatus(r))}
                                                    value=""
                                                    placeholder={getReturnStatus(r)}
                                                    onChange={(val) => setConfirmModal({ isOpen: true, id: r._id || r.id, value: val, type: 'return' })}
                                                    minWidth="w-32"
                                                    triggerClassName="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                                />
                                            </div>
                                        ) : (
                                            <LeaveReturnBadge returnTracking={r.returnTracking} />
                                        )
                                    }
                                ].filter(Boolean)}
                            />
                        </div>
                    );
                }}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination?.totalRecords || 0}
                totalPages={pagination?.totalPages || 1}
            >
                {/* Custom Toolbar Actions */}
                <button
                    type="button"
                    onClick={onFilterClick}
                    className={`p-2.5 border rounded-xl transition-all cursor-pointer shadow-sm md:shadow-none shrink-0 flex items-center justify-center ${hasActiveFilters ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-10 w-10'}`}
                    title="Filter leaves"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </DataTable>

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
