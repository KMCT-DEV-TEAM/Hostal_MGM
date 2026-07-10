import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchParams } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import Button from '@/components/ui/Button';
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
    getDashboardSummary
} from '@/services/visitor.service';
import { useDebounce } from '@/hooks/useDebounce';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDateStandard } from '@/utils/formatters';

const VisitorsPage = () => {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
    const [stats, setStats] = useState(null);

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
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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

    const fetchVisitors = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
                page,
                limit: 10
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
            const totalPages = res?.totalPages || Math.ceil(visitorsData.length / 10) || 1;

            setVisitors(visitorsData);
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
    }, [debouncedSearch, statusFilter, page, isParent, isStudent, showAggregatedView, selectedHostel]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleApprove = async (id) => {
        try {
            await approveVisitor(id);
            showSuccessToast('Visitor approved successfully');
            fetchVisitors();
        } catch (error) {
            showErrorToast('Failed to approve visitor');
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectVisitor(id, { reason: 'Rejected by admin' });
            showSuccessToast('Visitor rejected successfully');
            fetchVisitors();
        } catch (error) {
            showErrorToast('Failed to reject visitor');
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
        <div className="flex flex-col h-full bg-gray-50 md:bg-gray-50/50 p-4 md:p-6 pb-20 md:pb-6 overflow-hidden">
            {/* Header Section */}
            <div className="mb-6 shrink-0 flex items-center gap-4">
                {selectedHostel && isSuperAdmin && (
                    <button
                        onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('hostelId');
                            newParams.delete('hostelName');
                            setSearchParams(newParams);
                        }}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <PageHeader
                    title={selectedHostel ? `Visitors - ${selectedHostel.name}` : "Visitors"}
                    subtitle={showAggregatedView ? "Overview of visitors across all hostels" : "Manage visitor requests and profiles"}
                />
            </div>

            {/* Shared Stats Component */}
            {['super_admin', 'admin', 'warden'].includes(role) && stats && (
                <div className="shrink-0">
                    <VisitorStats stats={stats} />
                </div>
            )}

            {/* Table View */}
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
                    canExport={canExport}
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
                    page={page}
                    setPage={setPage}
                    pagination={pagination}
                    onRowClick={handleRowClick}
                    userRole={user?.role}
                />
            )}

            <RegisterVisitorModal
                isOpen={showCheckInModal}
                onClose={() => setShowCheckInModal(false)}
                onSuccess={() => {
                    setShowCheckInModal(false);
                    fetchVisitors();
                }}
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
            />
        </div>
    );
};

export default VisitorsPage;
