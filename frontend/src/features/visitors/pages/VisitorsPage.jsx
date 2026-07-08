import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import VisitorListTableView from '../components/VisitorListTableView';
import RegisterVisitorModal from '../components/modals/RegisterVisitorModal';
import {
    getAllVisitors,
    getParentVisitors,
    getStudentVisitors,
    approveVisitor,
    rejectVisitor
} from '@/services/visitor.service';
import { useDebounce } from '@/hooks/useDebounce';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDateStandard } from '@/utils/formatters';
import { useMemo } from 'react';

const VisitorsPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

    const debouncedSearch = useDebounce(searchQuery, 500);

    const role = user?.role || ROLES.SUPER_ADMIN;

    const isManagement = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN].includes(role);
    const isParent = role === ROLES.PARENT;
    const isStudent = role === ROLES.STUDENT;

    const canApproveReject = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);
    const canExport = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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
            if (isParent) {
                res = await getParentVisitors(params);
            } else if (isStudent) {
                res = await getStudentVisitors(params);
            } else {
                res = await getAllVisitors(params);
            }

            const visitorsData = res?.data || [];

            const totalItems = res?.total || visitorsData.length || 0;
            const totalPages = res?.totalPages || Math.ceil(visitorsData.length / 10) || 1;

            setVisitors(visitorsData);
            setPagination({ totalPages, totalItems });
        } catch (error) {
            console.error("Failed to fetch visitors", error);
            showErrorToast('Failed to load visitors');
        } finally {
            setLoading(false);
        }
    }, [isParent, isStudent, debouncedSearch, statusFilter, page]);

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
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 bg-background-secondary flex flex-col">
            <div className="mb-6 shrink-0 flex items-center justify-between gap-4">
                <PageHeader
                    title="Visitors"
                    subtitle="Manage visitor requests and profiles"
                />
            </div>

            {/* Table View */}
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
            />

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
        </div>
    );
};

export default VisitorsPage;
