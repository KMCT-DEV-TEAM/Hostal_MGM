import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import VisitorListTableView from '../components/VisitorListTableView';
import CheckInModal from '../components/modals/CheckInModal';
import {
    getAllVisitors,
    getParentVisitors,
    getStudentVisitors,
    approveVisitor,
    rejectVisitor
} from '@/services/visitor.service';

const VisitorsPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

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
                search: searchQuery || undefined,
                status: statusFilter || undefined,
                page: 1, // Add proper pagination state if needed
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

            // Extract data array from the paginated response format expected
            const visitorsData = res?.data || res?.visitors || [];
            setVisitors(visitorsData);
        } catch (error) {
            console.error("Failed to fetch visitors", error);
            showErrorToast('Failed to load visitors');
        } finally {
            setLoading(false);
        }
    }, [isParent, isStudent, searchQuery, statusFilter]);

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

            {/* Toggle Buttons for Status Filter */}
            <div className="shrink-0 flex bg-gray-200/50 rounded-xl p-1 mb-6 w-fit border border-gray-200">
                {['All', 'Pending', 'Approved', 'Rejected'].map(status => {
                    const isActive = (statusFilter === status || (status === 'All' && !statusFilter));
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status === 'All' ? '' : status)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isActive
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {status}
                        </button>
                    );
                })}
            </div>

            {/* Table View */}
            <VisitorListTableView
                visitors={visitors}
                loading={loading}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                onFilterClick={() => { }} // Additional filters if needed
                onExportClick={() => { }} // Export logic
                hasActiveFilters={!!statusFilter}
                canApproveReject={canApproveReject}
                canExport={canExport}
                canRegister={isParent}
                onRegisterClick={() => setShowCheckInModal(true)}
                onApprove={handleApprove}
                onReject={handleReject}
            />

            <CheckInModal
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
