import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import PageHeader from '@/components/ui/PageHeader';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import { useLeaves } from '../hooks/useLeaves';
import { useDebounce } from '@/hooks/useDebounce';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import leaveService, { getLeaves, getAdminDashboardStats } from '@/services/leave.service';
import LeavesAggregateView from '../components/views/LeavesAggregateView';
import LeavesDetailView from '../components/views/LeavesDetailView';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDate } from '@/utils/dateFormatter';

export default function AdminLeaves() {
    const { passType, hostelName } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const role = useAuthStore((s) => s.user?.role) || ROLES.SUPER_ADMIN;

    const isHomePass = passType === 'home-pass' || !passType;
    const isSuperAdmin = role === ROLES.SUPER_ADMIN;
    const isWarden = role === ROLES.WARDEN;
    const isAdmin = role === ROLES.ADMIN;

    const [viewId, setViewId] = useState(null);
    const selectedHostel = hostelName ? decodeURIComponent(hostelName) : null;
    const isDetailView = !!selectedHostel || isWarden || isAdmin;

    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const searchQuery = searchParams.get('search') || '';
    const orgFilter = searchParams.get('org') || 'All';
    const statusFilter = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;

    const debouncedSearch = useDebounce(searchQuery, 500);

    const exportFields = useMemo(() => [
        {
            name: "startDate",
            label: "From Date",
            type: "date"
        },
        {
            name: "endDate",
            label: "To Date",
            type: "date"
        },
        {
            name: "status",
            label: "Status",
            options: [
                { label: 'All Status', value: '' },
                { label: 'Pending Admin', value: 'pending_admin' },
                { label: 'Pending Parent', value: 'pending_parent' },
                { label: 'Pending Warden', value: 'pending_warden' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Completed', value: 'completed' },
            ]
        }
    ], []);

    const updateSearchParams = (updates) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

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

    const { data: hostelData, loading: hostelsLoading } = useLeaves({
        passType: isHomePass ? 'home_pass' : 'out_pass',
        search: debouncedSearch,
        organization: orgFilter !== 'All' ? orgFilter : undefined,
    }, true, { enabled: isSuperAdmin && !selectedHostel });

    const [adminStats, setAdminStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

    useEffect(() => {
        if (isAdmin) {
            getAdminDashboardStats({ passType: isHomePass ? 'home_pass' : 'out_pass' })
                .then(res => {
                    const statsData = res?.data?.data || res?.data || res;
                    setAdminStats({
                        total: statsData.total || statsData.totalRequests || statsData.totalRequest || 0,
                        approved: statsData.approved || 0,
                        pending: statsData.pending || 0,
                        rejected: statsData.rejected || 0
                    });
                })
                .catch(console.error);
        }
    }, [isAdmin, isHomePass]);

    const pageSubtitle = useMemo(() => {
        if (isSuperAdmin) return "Monitor leave requests and approvals across all hostels.";
        if (isWarden) return isHomePass ? "view and manage student leave applications" : "view and manage student permission applications";
        if (isAdmin) return isHomePass ? "View and monitor Leave applications submitted by students across the hostel." : "View and monitor Permission applications submitted by students across the hostel.";
        return "Manage student leave and out pass requests";
    }, [isSuperAdmin, isWarden, isAdmin, isHomePass]);

    const stats = useMemo(() => {
        if (isAdmin) return adminStats;

        if (!hostelData || hostelData.length === 0) {
            return { total: 0, approved: 0, pending: 0, rejected: 0 };
        }
        let relevantHostels = hostelData;
        if (isSuperAdmin && selectedHostel) {
            relevantHostels = hostelData.filter(h => h._id === selectedHostel);
        }
        return relevantHostels.reduce((acc, curr) => {
            const total = curr.leaves ?? (curr.pending + curr.approved + curr.rejected);
            return {
                total: acc.total + (total || 0),
                approved: acc.approved + (curr.approved || 0),
                pending: acc.pending + (curr.pending || 0),
                rejected: acc.rejected + (curr.rejected || 0)
            };
        }, { total: 0, approved: 0, pending: 0, rejected: 0 });
    }, [hostelData, isSuperAdmin, selectedHostel, isAdmin, adminStats]);

    const handleUpdateStatus = async (id, newStatus) => {
        if (!isAdmin) return;
        try {
            if (newStatus === 'Approved' || newStatus === 'approved') {
                await leaveService.approvePass(role, id, { remarks: 'Approved by Admin' });
            } else if (newStatus === 'Rejected' || newStatus === 'rejected') {
                await leaveService.rejectPass(role, id, { remarks: 'Rejected by Admin' });
            }
            showSuccessToast('Status updated successfully');
            if (refetchPasses) refetchPasses();
        } catch (err) {
            showErrorToast(err?.response?.data?.message || err.message || 'Failed to update status');
        }
    };

    const handleUpdateReturn = async (id, newReturn) => {
        if (!isWarden) return;
        try {
            if (newReturn === 'Left') {
                await leaveService.markStudentLeft(id);
                showSuccessToast('Student marked as left');
            } else if (newReturn === 'Returned') {
                await leaveService.markStudentReturned(id);
                showSuccessToast('Student marked as returned');
            }
            if (refetchPasses) refetchPasses();
        } catch (err) {
            showErrorToast(err?.response?.data?.message || err.message || 'Failed to update return status');
        }
    };

    const handleExport = () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const passTypeFilter = isHomePass ? 'home_pass' : 'out_pass';
            
            const params = {
                passType: passTypeFilter,
                hostelId: selectedHostel,
                search: debouncedSearch,
                status: exportFilters.status || statusFilter,
                organization: orgFilter !== 'All' ? orgFilter : undefined,
                startDate: exportFilters.startDate,
                endDate: exportFilters.endDate,
                limit: 5000 // High limit to fetch all for export
            };

            // Clean up empty params
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
            );

            const response = await getLeaves(role, cleanParams);
            const dataToExport = response?.data || response?.passes || [];

            if (dataToExport.length === 0) {
                showErrorToast('Export failed', 'No leave records match the selected filters');
                setIsExportConfirmOpen(false);
                setIsExporting(false);
                return;
            }

            const exportData = dataToExport.map((r, index) => {
                const base = {
                    "S.No": index + 1,
                    "Student Name": r.studentInfo?.name || r.studentName || 'Unknown',
                    "Hostel": r.hostelInfo?.name || r.hostelId?.name || r.hostel || 'N/A',
                    "Room No": r.studentInfo?.roomNo || r.roomNo || '--',
                    "Pass Type": passTypeFilter === 'home_pass' ? 'Home Pass' : 'Out Pass',
                };
                
                if (passTypeFilter === 'home_pass') {
                    base["Leave Period"] = `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}`;
                    base["Days"] = r.duration || r.totalDays || '--';
                } else {
                    base["Date"] = formatDate(r.fromDate || r.date);
                    base["Type"] = r.type || r.outPassCategory || '--';
                    base["Out Time"] = r.outTime || '--';
                    base["Expected Return"] = r.expectedReturnTime || '--';
                }

                base["Status"] = r.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
                
                if (r.returnTracking?.returnedAt) {
                    base["Return Status"] = 'Returned';
                    base["Actual Return"] = formatDate(r.returnTracking.returnedAt);
                } else if (r.returnTracking?.leftHostelAt) {
                    base["Return Status"] = 'Left Hostel';
                    base["Left At"] = formatDate(r.returnTracking.leftHostelAt);
                } else {
                    base["Return Status"] = '--';
                }

                return base;
            });

            const isSuccess = exportToExcel(exportData, `Leaves_Export_${passTypeFilter}`, "Leaves");

            if (isSuccess) {
                showSuccessToast('Exported successfully');
            } else {
                showErrorToast('Export failed', 'Could not generate the Excel file');
            }

            setIsExportConfirmOpen(false);
        } catch (err) {
            console.error("Failed to export leaves:", err);
            showErrorToast('Export failed', err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 flex flex-col">
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
                    title={selectedHostel ? `${isHomePass ? "Home Pass" : "Out Pass"}` : (isHomePass ? "Home Pass" : "Out Pass")}
                    subtitle={selectedHostel ? `Monitoring student leave records` : pageSubtitle}
                />
            </div>

            <LeaveStatsCards stats={stats} isAdmin={true} />

            {isDetailView ? (
                <LeavesDetailView
                    passesData={passesData}
                    loading={passesLoading}
                    searchQuery={searchQuery}
                    setSearchQuery={(q) => updateSearchParams({ search: q, page: 1 })}
                    statusFilter={statusFilter}
                    setStatusFilter={(s) => updateSearchParams({ status: s, page: 1 })}
                    isHomePass={isHomePass}
                    isWarden={isWarden}
                    isAdmin={isAdmin}
                    passType={passType}
                    selectedHostel={selectedHostel}
                    onRowClick={(r) => setViewId(r._id || r.id)}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateReturn={handleUpdateReturn}
                    onExport={handleExport}
                    page={page}
                    setPage={(p) => updateSearchParams({ page: p })}
                    pagination={passesPagination}
                />
            ) : (
                <LeavesAggregateView
                    hostelData={hostelData}
                    loading={hostelsLoading}
                    searchQuery={searchQuery}
                    setSearchQuery={(q) => updateSearchParams({ search: q, page: 1 })}
                    onHostelClick={(id) => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(id)}`)}
                    page={page}
                    setPage={(p) => updateSearchParams({ page: p })}
                    pagination={{ totalRecords: hostelData?.length || 0, totalPages: 1 }}
                />
            )}

            <LeaveDetailsModal
                isOpen={!!viewId}
                onClose={() => {
                    setViewId(null);
                    if (refetchPasses) refetchPasses();
                }}
                leaveId={viewId}
                isHomePass={isHomePass}
                userRole={role}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title={`Export ${isHomePass ? 'Home Passes' : 'Out Passes'}`}
                fields={exportFields}
            />
        </div>
    );
}