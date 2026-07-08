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
                onExportClick={() => { }} // Export logic
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
        </div>
    );
};

export default VisitorsPage;
