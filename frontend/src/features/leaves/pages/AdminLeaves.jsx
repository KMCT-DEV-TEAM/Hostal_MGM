
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import PageHeader from '@/components/ui/PageHeader';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import { useLeaves } from '../hooks/useLeaves';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import leaveService, { getLeaves, getAdminDashboardStats, getWardenDashboardStats } from '@/services/leave.service';
import LeavesAggregateView from '../components/views/LeavesAggregateView';
import LeavesDetailView from '../components/views/LeavesDetailView';
import FilterLeavesModal from '../components/modals/FilterLeavesModal';
import LeaveActionModal from '../components/modals/LeaveActionModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDateStandard } from '@/utils/formatters';
import BackButton from '@/components/ui/BackButton';

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

    const urlSearchQuery = searchParams.get('search') || '';
    const orgFilter = searchParams.get('org') || 'All';
    const statusFilter = searchParams.get('status') || '';
    const categoryFilter = searchParams.get('category') || '';
    const fromDateFilter = searchParams.get('fromDate') || '';
    const toDateFilter = searchParams.get('toDate') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Action modal state for approve/reject
    const [actionModalConfig, setActionModalConfig] = useState({ isOpen: false, actionType: '', id: null });
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    // Check if any filters are active (excluding search and page)
    const hasActiveFilters = Boolean(statusFilter || categoryFilter || fromDateFilter || toDateFilter || (orgFilter !== 'All'));

    const [searchInput, setSearchInput] = useState(urlSearchQuery);

    useEffect(() => {
        setSearchInput(urlSearchQuery);
    }, [urlSearchQuery]);

    useEffect(() => {
        if (searchInput !== urlSearchQuery) {
            const newParams = new URLSearchParams(searchParams);
            if (!searchInput) {
                newParams.delete('search');
            } else {
                newParams.set('search', searchInput);
            }
            newParams.set('page', 1);
            setSearchParams(newParams);
        }
    }, [searchInput, urlSearchQuery, searchParams, setSearchParams]);

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
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Returned', value: 'returned' },
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
            outPassCategory: categoryFilter,
            startDate: fromDateFilter,
            endDate: toDateFilter,
            search: searchInput,
            page,
            limit
        },
        false,
        { enabled: isDetailView }
    );

    const { data: hostelData, loading: hostelsLoading } = useLeaves({
        passType: isHomePass ? 'home_pass' : 'out_pass',
        search: searchInput,
        organization: orgFilter !== 'All' ? orgFilter : undefined,
    }, true, { enabled: isSuperAdmin && !selectedHostel });

    const [adminStats, setAdminStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

    useEffect(() => {
        if (isAdmin || isWarden) {
            const fetchStats = isWarden ? getWardenDashboardStats : getAdminDashboardStats;
            fetchStats({ passType: isHomePass ? 'home_pass' : 'out_pass' })
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
    }, [isAdmin, isWarden, isHomePass]);

    const pageSubtitle = useMemo(() => {
        if (isSuperAdmin) return "Monitor leave requests and approvals across all hostels.";
        if (isWarden) return isHomePass ? "view and manage student leave applications" : "view and manage student permission applications";
        if (isAdmin) return isHomePass ? "View and monitor Leave applications submitted by students across the hostel." : "View and monitor Permission applications submitted by students across the hostel.";
        return "Manage student leave and out pass requests";
    }, [isSuperAdmin, isWarden, isAdmin, isHomePass]);

    const stats = useMemo(() => {
        if (isAdmin || isWarden) return adminStats;
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

    const handleUpdateStatus = (id, newStatus) => {
        if (!isAdmin) return;
        if (newStatus === 'Approved' || newStatus === 'approved') {
            setActionModalConfig({ isOpen: true, actionType: 'approved', id });
        } else if (newStatus === 'Rejected' || newStatus === 'rejected') {
            setActionModalConfig({ isOpen: true, actionType: 'rejected', id });
        }
    };

    const handleConfirmAction = async (remarks) => {
        const { actionType, id } = actionModalConfig;
        if (!id) return;
        try {
            setIsActionSubmitting(true);
            if (actionType === 'approved') {
                await leaveService.approvePass(role, id, { remarks });
            } else if (actionType === 'rejected') {
                await leaveService.rejectPass(role, id, { remarks });
            }
            showSuccessToast('Status updated successfully');
            if (refetchPasses) refetchPasses();
            setActionModalConfig({ isOpen: false, actionType: '', id: null });
        } catch (err) {
            showErrorToast(err?.response?.data?.message || err.message || 'Failed to update status');
        } finally {
            setIsActionSubmitting(false);
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
                search: searchInput,
                status: exportFilters.status || statusFilter,
                outPassCategory: categoryFilter,
                organization: orgFilter !== 'All' ? orgFilter : undefined,
                startDate: exportFilters.startDate || fromDateFilter,
                endDate: exportFilters.endDate || toDateFilter,
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
                    base["Leave Period"] = `${formatDateStandard(r.fromDate)} - ${formatDateStandard(r.toDate)}`;
                    base["Days"] = r.duration || r.totalDays || '--';
                } else {
                    base["Date"] = formatDateStandard(r.fromDate || r.date);
                    base["Type"] = r.type || r.outPassCategory || '--';
                    base["Out Time"] = r.outTime || '--';
                    base["Expected Return"] = r.expectedReturnTime || '--';
                }

                base["Status"] = r.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';

                if (r.returnTracking?.returnedAt) {
                    base["Return Status"] = 'Returned';
                    base["Actual Return"] = formatDateStandard(r.returnTracking.returnedAt);
                } else if (r.returnTracking?.leftHostelAt) {
                    base["Return Status"] = 'Left Hostel';
                    base["Left At"] = formatDateStandard(r.returnTracking.leftHostelAt);
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
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="mb-6 shrink-0 flex items-center gap-3">

                <PageHeader
                    title={selectedHostel ? `${isHomePass ? "Home Pass" : "Out Pass"}` : (isHomePass ? "Home Pass" : "Out Pass")}
                    subtitle={selectedHostel ? `Monitoring student leave records` : pageSubtitle}
                    actionButton={selectedHostel && (
                        <BackButton text={'Back to List'} onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}`)} />
                    )}
                />
            </div>

            <LeaveStatsCards stats={stats} isAdmin={true} />

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                    {isDetailView ? (
                        <LeavesDetailView
                            passesData={passesData}
                            loading={passesLoading}
                            searchQuery={searchInput}
                            setSearchQuery={setSearchInput}
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
                            onFilterClick={() => setIsFilterModalOpen(true)}
                            hasActiveFilters={hasActiveFilters}
                            page={page}
                            setPage={(p) => updateSearchParams({ page: p })}
                            pagination={passesPagination}
                        />
                    ) : (
                        <LeavesAggregateView
                            hostelData={hostelData}
                            loading={hostelsLoading}
                            searchQuery={searchInput}
                            setSearchQuery={setSearchInput}
                            onHostelClick={(id) => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(id)}`)}
                            page={page}
                            setPage={(p) => updateSearchParams({ page: p })}
                            pagination={{ totalRecords: hostelData?.length || 0, totalPages: 1 }}
                        />
                    )}
                </div>

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

            <LeaveActionModal
                isOpen={actionModalConfig.isOpen}
                onClose={() => setActionModalConfig({ isOpen: false, actionType: '', id: null })}
                actionType={actionModalConfig.actionType}
                onSubmit={handleConfirmAction}
                isSubmitting={isActionSubmitting}
            />

            <FilterLeavesModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                pageTitle={isHomePass ? 'Home Passes' : 'Out Passes'}
                isOutPass={!isHomePass}
                filters={{
                    status: statusFilter,
                    category: categoryFilter,
                    fromDate: fromDateFilter,
                    toDate: toDateFilter
                }}
                onApply={(newFilters) => {
                    updateSearchParams({
                        status: newFilters.status,
                        category: newFilters.category,
                        fromDate: newFilters.fromDate,
                        toDate: newFilters.toDate,
                        page: 1
                    });
                    setIsFilterModalOpen(false);
                }}
                onReset={() => {
                    updateSearchParams({
                        status: '',
                        category: '',
                        fromDate: '',
                        toDate: '',
                        page: 1
                    });
                    setIsFilterModalOpen(false);
                }}
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
        </div>
    );
}
