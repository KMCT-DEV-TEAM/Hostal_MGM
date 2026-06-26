import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Filter, Download } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Dropdown from '@/components/ui/Dropdown';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import { showSuccessToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import { useLeaves } from '../hooks/useLeaves';
import { useDebounce } from '@/hooks/useDebounce';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import { formatDate } from '../utils/formatters';
import leaveService from '@/services/leave.service';

export default function AdminLeaves() {
    const { passType, hostelName } = useParams(); // 'home-pass', 'outpass', and optional 'hostelName'
    const navigate = useNavigate();
    const role = useAuthStore((s) => s.user?.role) || ROLES.SUPER_ADMIN;

    const isHomePass = passType === 'home-pass' || !passType;
    const isSuperAdmin = role === ROLES.SUPER_ADMIN;
    const isWarden = role === ROLES.WARDEN;
    const isAdmin = role === ROLES.ADMIN;

    // View Modal State
    const [viewId, setViewId] = useState(null);

    // Detail view state derived from route
    const selectedHostel = hostelName ? decodeURIComponent(hostelName) : null;

    const [searchQuery, setSearchQuery] = useState('');
    const [orgFilter, setOrgFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    const debouncedSearch = useDebounce(searchQuery, 500);

    // Reset pagination, search filters on subroute or hostel changes
    useEffect(() => {
        setSearchQuery('');
        setOrgFilter('All');
        setStatusFilter('');
        setPage(1);
    }, [passType, hostelName]);

    // Data Fetching
    const isDetailView = !!selectedHostel || !isSuperAdmin;

    const { data: passesData, pagination: passesPagination, loading: passesLoading, refetch: refetchPasses } = useLeaves(
        {
            passType: isHomePass ? 'home_pass' : 'out_pass',
            hostelId: selectedHostel,
            status: statusFilter ? statusFilter.toLowerCase() : '',
            search: debouncedSearch,
            page,
            limit
        },
        false,
        { enabled: isDetailView }
    );

    const { data: hostelData, loading: hostelsLoading, refetch: refetchHostels } = useLeaves(
        {
            search: debouncedSearch,
            organization: orgFilter !== 'All' ? orgFilter : ''
        },
        true,
        { enabled: !isDetailView }
    );

    // Role-based Subtitle Configuration
    const pageSubtitle = useMemo(() => {
        if (isSuperAdmin) {
            return "Monitor leave requests and approvals across all hostels.";
        }
        if (isWarden) {
            return isHomePass
                ? "view and manage student leave applications"
                : "view and manage student permission applications";
        }
        if (isAdmin) {
            return isHomePass
                ? "View and monitor Leave applications submitted by students across the hostel."
                : "View and monitor Permission applications submitted by students across the hostel.";
        }
        return "Manage student leave and out pass requests";
    }, [isSuperAdmin, isWarden, isAdmin, isHomePass]);

    // Statistics Counts
    const stats = useMemo(() => {
        if (isSuperAdmin) {
            return { total: 40, approved: 30, pending: 10, rejected: 10 };
        }
        const total = 40;
        const approved = 30;
        const pending = 10;
        const rejected = 10;
        return { total, approved, pending, rejected };
    }, [isSuperAdmin]);

    const paginatedItems = isDetailView ? passesData : hostelData;
    const isLoading = isDetailView ? passesLoading : hostelsLoading;
    const currentPagination = isDetailView ? passesPagination : { totalRecords: hostelData.length, totalPages: 1 };

    const handleUpdateStatus = async (id, newStatus) => {
        if (!isAdmin) return;
        try {
            if (newStatus === 'Approved' || newStatus === 'approved') {
                await leaveService.approvePass(id, { remarks: 'Approved by Admin' });
            } else if (newStatus === 'Rejected' || newStatus === 'rejected') {
                await leaveService.rejectPass(id, { remarks: 'Rejected by Admin' });
            }
            showSuccessToast('Status updated successfully');
            if (refetchPasses) refetchPasses();
        } catch (err) {
            showErrorToast(err?.response?.data?.message || err.message || 'Failed to update status');
        }
    };

    const getStudentName = (r) => r.studentId?.name || r.studentName || 'Unknown';
    const getStudentInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Update Return status
    const handleUpdateReturn = (id, newReturn) => {
        setStudentRequests(prev =>
            prev.map(r => r.id === id ? { ...r, returnStatus: newReturn } : r)
        );
        showSuccessToast('Return status updated successfully');
    };

    // Badges render helpers
    const renderStatusBadge = (status) => {
        const bgClass = status === 'Approved' ? 'bg-[#ECFDF5] border border-[#A7F3D0]' : 'bg-[#FFFBEB] border border-[#FDE68A]';
        const textClass = status === 'Approved' ? 'text-[#065F46]' : 'text-[#92400E]';
        return (
            <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${bgClass} ${textClass}`}>
                {status}
            </span>
        );
    };

    const renderReturnBadge = (returnStatus) => {
        if (returnStatus === 'Returned') {
            return (
                <span className="px-3.5 py-1.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Returned
                </span>
            );
        }
        if (returnStatus === 'Not Returned') {
            return (
                <span className="px-3.5 py-1.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FEE2E2] rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" /> Not Returned
                </span>
            );
        }
        return <span className="text-gray-400 font-semibold">-----</span>;
    };

    // Dropdown options inside list tables
    const statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    const returnOptions = [
        { label: '-----', value: '-----' },
        { label: 'Returned', value: 'Returned' },
        { label: 'Not Returned', value: 'Not Returned' }
    ];

    // Table Headers Configuration based on Role, Subroute, and Drilldown State
    const tableHeaders = useMemo(() => {
        if (selectedHostel) {
            const midCol = "Room No";
            const dateCol = isHomePass ? "Leave Period" : "Date";
            const typeCol = isHomePass ? "Days" : "Type";
            if (isHomePass) {
                return ["Student", midCol, dateCol, typeCol, { label: "Status", align: "start" }, { label: "Return", align: "start" }];
            } else {
                return ["Student", midCol, dateCol, typeCol, "Out", "Out", { label: "Status", align: "start" }, { label: "Return", align: "start" }];
            }
        }

        if (isSuperAdmin) {
            return isHomePass
                ? ["Organization", "Hostel", "Total Request", "Pending", "Approved"]
                : ["Organization", "Hostel", "Total Request", "Pending", "Approved", "Rejected"];
        }

        // Warden and Admin views
        const midCol = isWarden ? "Room No" : "Hostel";
        const dateCol = isHomePass ? "Leave Period" : "Date";
        const typeCol = isHomePass ? "Days" : "Type";

        if (isHomePass) {
            return ["Student", midCol, dateCol, typeCol, { label: "Status", align: "start" }, { label: "Return", align: "start" }];
        } else {
            return ["Student", midCol, dateCol, typeCol, "Out", "Out", { label: "Status", align: "start" }, { label: "Return", align: "start" }];
        }
    }, [isSuperAdmin, isHomePass, isWarden, selectedHostel]);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 flex flex-col">

            {/* Header section with dynamic back button drilldown indicator */}
            <div className="mb-6 shrink-0 flex items-center gap-3">
                {selectedHostel && (
                    <button
                        type="button"
                        onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}`)}
                        className="p-2 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                        title="Back to List"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                )}
                <PageHeader
                    title={selectedHostel ? `${selectedHostel} - ${isHomePass ? "Home Pass" : "Out Pass"}` : (isHomePass ? "Home Pass" : "Out Pass")}
                    subtitle={selectedHostel ? `Monitoring student leave records for ${selectedHostel}` : pageSubtitle}
                />
            </div>

            <LeaveStatsCards stats={stats} isAdmin={true} />

            {/* List Table Panel */}
            <DataTable
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search"
                loading={isLoading}
                onRowClick={(r) => isDetailView && setViewId(r._id || r.id)}
                toolbarActions={
                    <>
                        {isSuperAdmin && !selectedHostel ? (
                            <>
                                <Dropdown
                                    options={[
                                        { label: 'All', value: 'All' },
                                        { label: 'Engineering', value: 'Engineering' },
                                        { label: 'Medical', value: 'Medical' },
                                        { label: 'Pharmacy', value: 'Pharmacy' }
                                    ]}
                                    value={orgFilter}
                                    onChange={(val) => setOrgFilter(val)}
                                    placeholder="All"
                                    triggerClassName="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 flex justify-between items-center shadow-sm md:shadow-none"
                                />
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter(prev => prev ? '' : 'Pending')}
                                    className={`p-3 bg-white border rounded-xl transition-all cursor-pointer shadow-sm md:shadow-none shrink-0 flex items-center justify-center ${statusFilter ? 'border-[#0A437A] text-[#0A437A]' : 'border-gray-200 text-gray-400 hover:text-gray-600'
                                        }`}
                                    title="Toggle Pending status filter"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* Export Action */}
                        <button
                            type="button"
                            onClick={() => showSuccessToast('Exporting leave data...')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </>
                }
                headers={tableHeaders}
                items={paginatedItems}
                canSelect={false}
                emptyText="No leave records matching the active filters."
                renderRow={(r) => {
                    // Display student rows if detailed view is active or user is not a Super Admin
                    if (selectedHostel || !isSuperAdmin) {
                        return (
                            <>
                                {/* Student initials and full name */}
                                <td className="p-4 flex items-center gap-3 font-bold text-gray-700">
                                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                        {getStudentInitials(studentName)}
                                    </div>
                                    <span className="text-sm font-semibold">{studentName}</span>
                                </td>

                                {/* Room No (if drilldown/warden) or Hostel name (if admin) */}
                                <td className="p-4 text-text-secondary font-medium">
                                    {selectedHostel || isWarden ? (r.studentId?.roomNo || r.roomNo || '--') : (
                                        <span
                                            className="text-primary font-semibold hover:underline cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostelId?._id || r.hostel)}`);
                                            }}
                                        >
                                            {r.hostelId?.name || r.hostel}
                                        </span>
                                    )}
                                </td>

                                {/* Period / Date */}
                                <td className="p-4 text-text-secondary lowercase">
                                    {isHomePass ? `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}` : formatDate(r.fromDate || r.date)}
                                </td>

                                {/* Days / Type */}
                                <td className="p-4 text-text-secondary capitalize">
                                    {isHomePass ? r.duration : r.type}
                                </td>

                                {/* Times (Out pass only) */}
                                {!isHomePass && (
                                    <>
                                        <td className="p-4 text-text-secondary">
                                            {r.outTime}
                                        </td>
                                        <td className="p-4 text-text-secondary">
                                            {r.returnTime}
                                        </td>
                                    </>
                                )}

                                {/* Inline Status Dropdown */}
                                <td className="p-4">
                                    {isAdmin ? (
                                        <Dropdown
                                            options={statusOptions}
                                            value={r.status === 'pending_admin' || r.status === 'pending_parent' || r.status === 'pending_warden' ? 'Pending' : r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : r.status}
                                            onChange={(val) => handleUpdateStatus(r._id || r.id, val)}
                                            minWidth="w-28"
                                            triggerClassName={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.status === 'approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#d1fae5]' :
                                                r.status === 'rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B] hover:bg-[#fee2e2]' :
                                                    'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#fef3c7]'
                                                }`}
                                        />
                                    ) : (
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-block ${r.status === 'approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                                            r.status === 'rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]' :
                                                'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                                            }`}>
                                            {r.status === 'pending_admin' || r.status === 'pending_parent' || r.status === 'pending_warden' ? 'Pending' : r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : r.status}
                                        </span>
                                    )}
                                </td>

                                {/* Inline Return Dropdown */}
                                <td className="p-4">
                                    <Dropdown
                                        options={returnOptions}
                                        value={r.returnStatus || '-----'}
                                        onChange={(val) => handleUpdateReturn(r.id, val)}
                                        minWidth="w-32"
                                        triggerClassName={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.returnStatus === 'Returned' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#d1fae5]' :
                                            r.returnStatus === 'Not Returned' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B] hover:bg-[#fee2e2]' :
                                                'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                            }`}
                                    />
                                </td>
                            </>
                        );
                    }

                    // Otherwise render Super Admin aggregates overview
                    return (
                        <>
                            <td className="p-4 text-text-secondary capitalize">
                                {r.organization}
                            </td>
                            <td
                                className="p-4 text-text-secondary hover:text-primary cursor-pointer"
                                onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostel)}`)}
                            >
                                {r.hostel}
                            </td>
                            <td className="p-4 text-text-secondary text-center sm:text-left">
                                {r.totalRequest}
                            </td>
                            <td className="p-4 text-text-secondary text-center sm:text-left">
                                {r.pending}
                            </td>
                            <td className="p-4 text-text-secondary text-center sm:text-left">
                                {r.approved}
                            </td>
                            {!isHomePass && (
                                <td className="p-4 text-text-secondary text-center sm:text-left">
                                    {r.rejected}
                                </td>
                            )}
                        </>
                    );
                }}
                renderMobileItem={(r) => {
                    if (!isDetailView) {
                        return (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#0A437A] capitalize">{r.organization}</span>
                                    <span
                                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                                        onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r._id || r.hostel)}`)}
                                    >
                                        {r.hostel}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-xs text-text-secondary font-semibold">
                                    <div>Total: {r.leaves}</div>
                                    <div>Pending: {r.pending}</div>
                                    <div>Approved: {r.approved}</div>
                                </div>
                            </div>
                        );
                    }

                    const studentName = getStudentName(r);

                    return (
                        <div className="space-y-2.5" onClick={() => setViewId(r._id || r.id)}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                        {getStudentInitials(studentName)}
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm">{studentName}</span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {selectedHostel || isWarden ? `Room ${r.studentId?.roomNo || r.roomNo}` : (
                                        <span
                                            className="text-[#0A437A] font-semibold hover:underline cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostelId?._id || r.hostel)}`);
                                            }}
                                        >
                                            {r.hostelId?.name || r.hostel}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <hr className="border-gray-50" />
                            <div className="text-xs text-text-secondary space-y-1.5">
                                <div>{isHomePass ? `Period: ${formatDate(r.fromDate)} - ${formatDate(r.toDate)} (${r.totalDays || r.duration})` : `Outing Time: ${r.outTime || '--'} - ${r.expectedReturnTime || r.returnTime || '--'}`}</div>
                                <div className="flex justify-between items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                                    <span>Status:</span>
                                    {isAdmin ? (
                                        <Dropdown
                                            options={[
                                                { label: 'Pending', value: 'pending_admin' },
                                                { label: 'Approved', value: 'approved' },
                                                { label: 'Rejected', value: 'rejected' }
                                            ]}
                                            value={r.status}
                                            onChange={(val) => handleUpdateStatus(r._id || r.id, val)}
                                            minWidth="w-24"
                                            triggerClassName={`px-2 py-1 rounded border flex items-center justify-between text-[10px] font-bold ${r.status === 'approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                                                r.status === 'rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]' :
                                                    'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                                                }`}
                                        />
                                    ) : (
                                        <span className={`px-2 py-1 rounded border inline-block text-[10px] font-bold ${r.status === 'approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                                            r.status === 'rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]' :
                                                'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                                            }`}>
                                            {r.status === 'pending_admin' || r.status === 'pending_parent' || r.status === 'pending_warden' ? 'Pending' : r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : r.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={currentPagination.totalRecords || 0}
                totalPages={currentPagination.totalPages || 1}
            />
        </div>
    );
}