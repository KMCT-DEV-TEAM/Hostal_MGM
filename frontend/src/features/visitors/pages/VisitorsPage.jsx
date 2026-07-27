import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchParams } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import { ArrowLeft } from 'lucide-react';
import VisitorStats from '../components/VisitorStats';
import VisitorListTableView from '../components/VisitorListTableView';
import VisitorProfilesAggregatedView from '../components/VisitorProfilesAggregatedView';
import RegisterVisitorModal from '../components/modals/RegisterVisitorModal';
import VisitorDetailsModal from '../components/modals/VisitorDetailsModal';
import {
    getAllVisitors,
    getParentVisitors,
    getStudentVisitors,
    approveVisitor,
    rejectVisitor,
    getSuperAdminHostelVisitors,
    getDashboardSummary,
    updateVisitorStatus
} from '@/services/visitor.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import VisitorsMobileView from '../views/VisitorsMobileView';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDateStandard } from '@/utils/formatters';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import BackButton from '@/components/ui/BackButton';
import FilterModal from '../components/modals/FilterModal';

const VisitorsPage = () => {
    const { user } = useAuthStore();
    const { isMobile } = useBreakpoint();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
    const [stats, setStats] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const debouncedSearch = useDebounce(searchQuery, 500);

    const role = user?.role || ROLES.SUPER_ADMIN;

    const isSuperAdmin = role === ROLES.SUPER_ADMIN;
    const isManagement = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN].includes(role);
    const isParent = role === ROLES.PARENT;
    const isStudent = role === ROLES.STUDENT;

    const urlHostelId = searchParams.get('hostelId');
    const urlHostelName = searchParams.get('hostelName');

    const selectedHostel = useMemo(() => {
        return urlHostelId ? { id: urlHostelId, name: urlHostelName } : null;
    }, [urlHostelId, urlHostelName]);

    const showAggregatedView = isSuperAdmin && !selectedHostel;

    const canApproveReject = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);
    const canExport = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [editVisitorData, setEditVisitorData] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, visitorId: null });
    const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedVisitorId, setSelectedVisitorId] = useState(null);

    const handleRowClick = (visitor) => {
        setSelectedVisitorId(visitor._id || visitor.id || visitor.visitorId);
        setIsDetailsModalOpen(true);
    };

    const exportFields = useMemo(() => [
        {
            name: "status",
            label: "Status",
            options: [
                { label: 'All Status', value: '' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Rejected', value: 'Rejected' },
            ]
        }
    ], []);
    const handleMobileFilter = (filters) => {
        setStatusFilter(filters.status);
        setPage(1);
    };
    const fetchVisitors = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
                page,
                limit
            };

            let res;
            if (showAggregatedView) {
                res = await getSuperAdminHostelVisitors(params);
            } else {
                if (selectedHostel) params.hostel = selectedHostel.id;

                if (isParent) {
                    res = await getParentVisitors(params);
                } else if (isStudent) {
                    res = await getStudentVisitors(params);
                } else {
                    res = await getAllVisitors(params);
                }
            }

            const visitorsData = res?.data || [];

            const totalItems = res?.total || visitorsData.length || 0;
            const totalPages = res?.totalPages || Math.ceil(visitorsData.length / limit) || 1;

            if (isMobile && page > 1) {
                setVisitors(prev => [...prev, ...visitorsData]);
            } else {
                setVisitors(visitorsData);
            }
            setPagination({ totalPages, totalItems });

            if (['super_admin', 'admin', 'warden'].includes(role)) {
                try {
                    const statsRes = await getDashboardSummary();
                    if (statsRes && statsRes.success) {
                        setStats(statsRes.cards);
                    }
                } catch (statsErr) {
                    console.error("Failed to fetch dashboard summary", statsErr);
                }
            } else {
                setStats(null);
            }
        } catch (error) {
            console.error("Failed to fetch visitors", error);
            showErrorToast('Failed to load visitors');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, page, limit, isParent, isStudent, showAggregatedView, selectedHostel]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleApprove = (id) => {
        setConfirmModal({ isOpen: true, type: 'approve', visitorId: id });
    };

    const handleReject = (id) => {
        setConfirmModal({ isOpen: true, type: 'reject', visitorId: id });
    };

    const handleEdit = (visitor) => {
        setEditVisitorData(visitor);
        setShowCheckInModal(true);
    };

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, type: 'delete', visitorId: id });
    };

    const handleActive = (id) => {
        setConfirmModal({ isOpen: true, type: 'active', visitorId: id });
    };

    const executeConfirmAction = async () => {
        const { type, visitorId } = confirmModal;
        if (!visitorId) return;

        setIsConfirmSubmitting(true);
        try {
            if (type === 'approve') {
                await approveVisitor(visitorId);
                showSuccessToast('Visitor approved successfully');
            } else if (type === 'reject') {
                await rejectVisitor(visitorId, { reason: 'Rejected by admin' });
                showSuccessToast('Visitor rejected successfully');
            } else if (type === 'delete') {
                await updateVisitorStatus(visitorId, 'Inactive');
                showSuccessToast('Visitor deleted successfully');
            } else if (type === 'active') {
                const newStatus = ['admin', 'super_admin'].includes(user?.role) ? 'Approved' : 'Pending';
                await updateVisitorStatus(visitorId, newStatus);
                showSuccessToast(`Visitor status updated to ${newStatus.toLowerCase()} successfully`);
            }
            fetchVisitors();
        } catch (error) {
            showErrorToast(`Failed to ${type} visitor`);
        } finally {
            setIsConfirmSubmitting(false);
            setConfirmModal({ isOpen: false, type: null, visitorId: null });
        }
    };

    const handleExport = () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = {
                search: debouncedSearch || undefined,
                status: exportFilters.status || statusFilter || undefined,
            };

            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
            );

            let response;
            if (isParent) {
                response = await getParentVisitors(cleanParams);
            } else if (isStudent) {
                response = await getStudentVisitors(cleanParams);
            } else {
                response = await getAllVisitors(cleanParams);
            }

            const dataToExport = response?.data || response?.visitors || [];

            if (dataToExport.length === 0) {
                showErrorToast('Export failed', 'No visitor records match the selected filters');
                setIsExportConfirmOpen(false);
                setIsExporting(false);
                return;
            }

            const exportData = dataToExport.map((r, index) => {
                const visitingStudentNames = r.students && r.students.length > 0
                    ? r.students.map(s => s.name || s).join(', ')
                    : '--';

                return {
                    "S.No": index + 1,
                    "Visitor Name": r.visitorName || r.name || 'Unknown',
                    "Visiting Student": visitingStudentNames,
                    "Organization": r.organizationName || '--',
                    "Phone": r.phone || '--',
                    "Email": r.email || '--',
                    "Relation": r.relationship || r.relation || '--',
                    "Status": r.status || 'Unknown',
                    "Created At": r.createdAt ? formatDateStandard(r.createdAt) : '--',
                    "Approved At": r.approvedAt ? formatDateStandard(r.approvedAt) : '--'
                };
            });

            const isSuccess = exportToExcel(exportData, 'Visitors_Export', 'Visitors');

            if (isSuccess) {
                showSuccessToast('Exported successfully');
            } else {
                showErrorToast('Export failed', 'Could not generate the Excel file');
            }

            setIsExportConfirmOpen(false);
        } catch (err) {
            console.error("Failed to export visitors:", err);
            showErrorToast('Export failed', err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {isMobile && (isParent || isStudent) ? (
                <VisitorsMobileView
                    visitors={visitors}
                    loading={loading}
                    hasMore={page < pagination.totalPages}
                    onLoadMore={() => setPage(p => p + 1)}
                    searchQuery={searchQuery}

                    setSearchQuery={(val) => {
                        setSearchQuery(val);
                        setPage(1);
                    }}
                    onFilterClick={() => setIsFilterModalOpen(true)}
                    isFilterApplied={!!statusFilter}
                    onAddClick={isParent ? () => setShowCheckInModal(true) : undefined}
                    onEdit={isParent ? handleEdit : undefined}
                />
            ) : (
                <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-background-secondary relative">
                    <div className="p-4 md:p-6 flex flex-col min-h-full">
                        {/* Header Section */}
                        <div className="mb-6 shrink-0 flex items-center gap-4">
                            <PageHeader
                                title={selectedHostel ? `Visitors - ${selectedHostel.name}` : "Visitors"}
                                actionButton={
                                    selectedHostel && isSuperAdmin && (
                                        <BackButton text="Back to All" />
                                    )
                                }
                                subtitle={showAggregatedView ? "Overview of visitors across all hostels" : "Manage visitor requests and profiles"}
                            />
                        </div>

                        {/* Shared Stats Component */}
                        {['super_admin', 'admin', 'warden'].includes(role) && stats && (
                            <div className="shrink-0 mb-4 md:mb-6">
                                <VisitorStats stats={stats} />
                            </div>
                        )}

                        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex flex-col flex-1 relative z-0">
                            {showAggregatedView ? (
                                <VisitorProfilesAggregatedView
                                    visitors={visitors}
                                    loading={loading}
                                    searchQuery={searchQuery}
                                    onSearch={setSearchQuery}
                                    onRowClick={(hostelObj) => {
                                        const newParams = new URLSearchParams(searchParams);
                                        newParams.set('hostelId', hostelObj.id);
                                        newParams.set('hostelName', hostelObj.name || '');
                                        setSearchParams(newParams);
                                    }}
                                    limit={limit}
                                    page={page}
                                    canExport={canExport}
                                    setLimit={setLimit}
                                    setPage={setPage}
                                    onExportClick={handleExport}
                                    userRole={user?.role}
                                />
                            ) : (
                                <VisitorListTableView
                                    visitors={visitors}
                                    loading={loading}
                                    searchQuery={searchQuery}
                                    onSearch={setSearchQuery}
                                    statusFilter={statusFilter}
                                    onStatusFilterChange={(val) => {
                                        setStatusFilter(val);
                                        setPage(1);
                                    }}
                                    onExportClick={handleExport}
                                    canApproveReject={canApproveReject}
                                    canExport={canExport}
                                    canRegister={isParent}
                                    onRegisterClick={() => setShowCheckInModal(true)}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    page={page}
                                    limit={limit}
                                    setPage={setPage}
                                    setLimit={setLimit}
                                    pagination={pagination}
                                    onRowClick={handleRowClick}
                                    userRole={user?.role}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
            <>
                <RegisterVisitorModal
                    isOpen={showCheckInModal}
                    initialData={editVisitorData}
                    onClose={() => {
                        setShowCheckInModal(false);
                        setEditVisitorData(null);
                    }}
                    onSuccess={() => {
                        setShowCheckInModal(false);
                        setEditVisitorData(null);
                        fetchVisitors();
                    }}
                />
                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    filters={{ status: statusFilter }}
                    onFilter={handleMobileFilter}
                    showDateFilters={false}
                    statusOptions={[
                        { label: 'All Status', value: '' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Approved', value: 'Approved' },
                        { label: 'Rejected', value: 'Rejected' },
                    ]}
                />

                <ExportFilterModal
                    isOpen={isExportConfirmOpen}
                    onClose={() => setIsExportConfirmOpen(false)}
                    onExport={confirmExport}
                    isExporting={isExporting}
                    title="Export Visitors"
                    subtitle="Select filters to apply before downloading visitor records"
                    fields={exportFields}
                />

                <VisitorDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedVisitorId(null);
                    }}
                    visitorId={selectedVisitorId}
                    userRole={user?.role}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDelete={handleDelete}
                    onActive={handleActive}
                />

                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => !isConfirmSubmitting && setConfirmModal({ isOpen: false, type: null, visitorId: null })}
                    onConfirm={executeConfirmAction}
                    title={
                        confirmModal.type === 'approve' ? 'Confirm Approval' :
                            confirmModal.type === 'reject' ? 'Confirm Rejection' :
                                confirmModal.type === 'active' ? 'Confirm Activation' :
                                    'Confirm Deletion'
                    }
                    message={
                        confirmModal.type === 'approve' ? 'Are you sure you want to approve this visitor request?' :
                            confirmModal.type === 'reject' ? 'Are you sure you want to reject this visitor request?' :
                                confirmModal.type === 'active' ? `Are you sure you want to activate this visitor? Their status will be set to ${['admin', 'super_admin'].includes(user?.role) ? 'approved' : 'pending'}.` :
                                    'Are you sure you want to delete this visitor profile?'
                    }
                    confirmText={
                        confirmModal.type === 'approve' ? 'Approve' :
                            confirmModal.type === 'reject' ? 'Reject' :
                                confirmModal.type === 'active' ? 'Activate' :
                                    'Delete'
                    }
                    confirmButtonClass={
                        confirmModal.type === 'approve' || confirmModal.type === 'active' ? 'bg-success hover:bg-success/90' :
                            'bg-danger hover:bg-danger/90'
                    }
                    isSubmitting={isConfirmSubmitting}
                />
            </>

        </>
    );
};

export default VisitorsPage;
