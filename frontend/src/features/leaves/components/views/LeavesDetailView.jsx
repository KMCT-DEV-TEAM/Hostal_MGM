import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Download } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Dropdown from '@/components/ui/Dropdown';
import { formatDate } from '../../utils/formatters';
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
        const outPassCols = isHomePass ? [] : ["In", "Out"];
        const statusCols = [{ label: "Status", align: "start" }, { label: "Return", align: "start" }];

        return [...baseCols, ...outPassCols, ...statusCols];
    }, [selectedHostel, isWarden, isAdmin, isHomePass]);


    return (
        <DataTable
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            searchPlaceholder="Search"
            loading={loading}
            onRowClick={onRowClick}
            toolbarActions={
                <>
                    <button
                        type="button"
                        onClick={onFilterClick}
                        className={`p-3 bg-white border rounded-xl transition-all cursor-pointer shadow-sm md:shadow-none shrink-0 flex items-center justify-center ${hasActiveFilters ? 'border-[#0A437A] text-[#0A437A] bg-[#0A437A]/5' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}
                        title="Filter leaves"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onExport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </>
            }
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
                            {selectedHostel || isWarden || isAdmin ? (r.studentInfo?.roomNo || r.roomNo || '--') : (
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
                            {isHomePass ? `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}` : formatDate(r.fromDate || r.date)}
                        </td>

                        {/* Days / Type */}
                        <td className="p-4 text-text-secondary capitalize">
                            {isHomePass ? r.duration : r.type || r.outPassCategory}
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
                                    onChange={(val) => onUpdateStatus(r._id || r.id, val)}
                                    minWidth="w-28"
                                    triggerClassName={`px-3 py-1.5 rounded-md text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-warning/10 border-warning/30 text-warning hover:bg-warning/20`}
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
                                    onChange={(val) => onUpdateReturn(r._id || r.id, val)}
                                    minWidth="w-32"
                                    triggerClassName={`px-3 py-1.5 rounded-md text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-white border-gray-200 text-gray-700 hover:bg-gray-50`}
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
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-[#0A437A]">
                                {studentName}
                            </span>
                            <LeaveStatusBadge status={r.status} />
                        </div>
                        <div className="text-xs text-text-secondary">
                            {isHomePass ? `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}` : formatDate(r.fromDate || r.date)}
                        </div>
                    </div>
                );
            }}
            page={page}
            setPage={setPage}
            limit={10}
            totalItems={pagination?.totalRecords || 0}
            totalPages={pagination?.totalPages || 1}
        />
    );
}
