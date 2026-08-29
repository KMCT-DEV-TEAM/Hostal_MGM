import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';
import { Filter } from 'lucide-react';
import { showSuccessToast } from '@/utils/toast';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import LeavesMobileView from '../views/LeavesMobileView';

import FilterLeavesModal from '../components/modals/FilterLeavesModal';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import InfoCard from '@/components/ui/InfoCard';
import leaveService from '@/services/leave.service';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import { formatDateReadable, formatTime } from '@/utils/formatters';
import { showErrorToast } from '@/utils/toast';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import LeaveActionModal from '../components/modals/LeaveActionModal';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';

export default function ParentLeaves() {
    const { passType } = useParams();
    const { activeStudentId } = useActiveStudent();
    const isHomePass = passType === 'home-pass' || !passType;
    const pageTitle = isHomePass ? 'Home Pass Requests' : 'Out Pass Requests';
    const pageSubtitle = isHomePass ? "Manage your children's home pass applications" : "Manage your children's out pass applications";

    const isRequestsTab = passType === 'requests' || !passType;
    const isHistoryTab = passType === 'history';

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statsData, setStatsData] = useState({ total: 0, approved: 0, pending: 0 });

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Action Modal State
    const [actionModalConfig, setActionModalConfig] = useState({ isOpen: false, actionType: '', request: null });
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    // View Modal State
    const [viewId, setViewId] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: '', category: '', passType: '', fromDate: '', toDate: '' });
    const [page, setPage] = useState(1);
    const limit = 10;

    const { isMobile } = useBreakpoint();

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const payload = {
                studentId: activeStudentId,
                page,
                limit,
                ...(searchQuery && { search: searchQuery }),
                ...(filters.status && { status: filters.status.toLowerCase() }),
                ...(filters.category && !isHomePass && { outPassCategory: filters.category }),
                ...(filters.passType && { passType: filters.passType }),
                ...(filters.fromDate && { fromDate: filters.fromDate }),
                ...(filters.toDate && { toDate: filters.toDate })
            };

            let res;
            let passesArray = [];

            if (!isMobile) {
                payload.passType = isHomePass ? 'home_pass' : 'out_pass';
                res = await leaveService.getLeavesByParent(payload);
                passesArray = res.data || res.passes || [];
            } else {
                payload.mode = isRequestsTab ? 'requests' : 'history';
                if (filters.status) {
                    payload.status = filters.status.toLowerCase();
                }
                res = await leaveService.getUnifiedPassesParent(payload);
                passesArray = res?.data || [];
            }

            if (isMobile && page > 1) {
                setRequests(prev => [...prev, ...passesArray]);
            } else {
                setRequests(passesArray);
            }

            const pagination = res.pagination || res.data?.pagination || {};
            setTotalItems(pagination.totalRecords || pagination.total || 0);
            setTotalPages(pagination.totalPages || pagination.pages || 1);

            setStatsData({
                total: res.summary?.total ?? pagination.totalRecords ?? 0,
                approved: res.summary?.approved ?? passesArray.filter(r => r.status === 'approved').length,
                pending: res.summary?.pending ?? passesArray.filter(r => r.status.includes('pending')).length,
                completed: res.summary?.completed ?? 0,
                rejected: res.summary?.rejected ?? 0,
            });
        } catch (err) {
            showErrorToast(err.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearchQuery('');
        setPage(1);
    }, [isHomePass, passType]);

    useEffect(() => {
        if (activeStudentId) {
            fetchLeaves();
        }
    }, [page, passType, isHomePass, filters.status, filters.category, filters.passType, filters.fromDate, filters.toDate, searchQuery, activeStudentId]);

    const openActionModal = (request, actionType) => {
        if (actionType === 'pending') return;
        setActionModalConfig({ isOpen: true, actionType, request });
    };

    const handleConfirmAction = async (remarks) => {
        if (!actionModalConfig.request) return;

        try {
            setIsActionSubmitting(true);
            const { actionType, request } = actionModalConfig;
            const payload = {
                studentId: activeStudentId,
                remarks: remarks,
                revision: request.revision ?? request.__v ?? 0
            };

            if (actionType === 'approved') {
                await leaveService.approveLeaveByParent(request.id ?? request._id, payload);
            } else if (actionType === 'rejected') {
                await leaveService.rejectLeaveByParent(request.id ?? request._id, payload);
            }

            showSuccessToast(`Pass ${actionType} successfully`);
            setActionModalConfig({ isOpen: false, actionType: '', request: null });
            fetchLeaves();
        } catch (err) {
            showErrorToast(err.message || `Failed to ${actionModalConfig.actionType} pass`);
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const getStudentName = (r) => {
        return r.studentId?.name || r.studentName || 'Student';
    };

    const getDurationDays = (r) => {
        if (r.totalDays) return r.totalDays;
        if (r.fromDate && r.toDate) {
            const days = Math.round((new Date(r.toDate) - new Date(r.fromDate)) / (1000 * 60 * 60 * 24));
            return days || 1;
        }
        return '--';
    };

    const statusOptions = [
        { label: 'Pending', value: 'pending_parent' },
        { label: 'Approve', value: 'approved' },
        { label: 'Reject', value: 'rejected' }
    ];

    const columns = isHomePass ? [
        {
            key: "child",
            header: "Child",
            renderCell: (r) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                        {getStudentName(r).split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{getStudentName(r)}</span>
                        <span className="text-xs text-text-secondary">Applied: {formatDateReadable(r.createdAt)}</span>
                    </div>
                </div>
            )
        },
        {
            key: "leavePeriod",
            header: "Leave Period",
            renderCell: (r) => (
                <span className="font-medium text-text-secondary text-sm">
                    {formatDateReadable(r.fromDate)} - {formatDateReadable(r.toDate)}
                </span>
            )
        },
        {
            key: "days",
            header: "Days",
            renderCell: (r) => (
                <span className="text-text-secondary text-sm">
                    {getDurationDays(r)} Days
                </span>
            )
        },
        {
            key: "returnTracking",
            header: "Return",
            renderCell: (r) => <LeaveReturnBadge returnTracking={r.returnTracking} />
        },
        {
            key: "status",
            header: "Status",
            renderCell: (r) => (
                <div onClick={(e) => e.stopPropagation()}>
                    {r.status === 'pending_parent' ? (
                        <Dropdown
                            options={statusOptions}
                            value="pending_parent"
                            onChange={(val) => openActionModal(r, val)}
                            minWidth="w-28"
                            triggerClassName="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-warning/10 border-warning/20 text-warning hover:bg-warning/20"
                        />
                    ) : (
                        <LeaveStatusBadge status={r.status} />
                    )}
                </div>
            )
        }
    ] : [
        {
            key: "child",
            header: "Child",
            renderCell: (r) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                        {getStudentName(r).split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{getStudentName(r)}</span>
                    </div>
                </div>
            )
        },
        {
            key: "date",
            header: "Date",
            renderCell: (r) => (
                <span className="font-medium text-text-secondary text-sm">
                    {formatDateReadable(r.fromDate || r.date)}
                </span>
            )
        },
        {
            key: "type",
            header: "Type",
            renderCell: (r) => (
                <span className="text-text-secondary text-sm">
                    {r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass')}
                </span>
            )
        },
        {
            key: "inTime",
            header: "In",
            renderCell: (r) => (
                <span className="text-text-secondary text-sm">
                    {r.expectedReturnTime || r.expectedReturnAt || r.returnTime ? formatTime(r.expectedReturnTime || r.expectedReturnAt || r.returnTime) : '--'}
                </span>
            )
        },
        {
            key: "outTime",
            header: "Out",
            renderCell: (r) => (
                <span className="text-text-secondary text-sm">
                    {r.outTime || r.fromDate ? formatTime(r.outTime || r.fromDate) : '--'}
                </span>
            )
        },
        {
            key: "returnTracking",
            header: "Return",
            renderCell: (r) => <LeaveReturnBadge returnTracking={r.returnTracking} />
        },
        {
            key: "status",
            header: "Status",
            renderCell: (r) => (
                <div onClick={(e) => e.stopPropagation()}>
                    {r.status === 'pending_parent' ? (
                        <Dropdown
                            options={statusOptions}
                            value="pending_parent"
                            onChange={(val) => openActionModal(r, val)}
                            minWidth="w-28"
                            triggerClassName="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-warning/10 border-warning/20 text-warning hover:bg-warning/20"
                        />
                    ) : (
                        <LeaveStatusBadge status={r.status} />
                    )}
                </div>
            )
        }
    ];

    const toolbarEndSlot = (
        <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex items-center justify-center p-2 rounded-xl transition-colors shadow-sm border h-full ${Object.values(filters).some(Boolean) ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
            <Filter className="w-4 h-4" />
        </button>
    );
    //         onFilterClick: () => setIsFilterModalOpen(true),
    //         isFilterApplied: !!(filters.status || filters.category || filters.passType || filters.fromDate || filters.toDate),
    //         onAddClick: undefined,
    //         openEditModal: undefined,
    //         statsData
    //     };
    const viewProps = {
        requests,
        loading,
        hasMore: page < totalPages,
        onLoadMore: () => setPage(p => p + 1),
        searchQuery,
        setSearchQuery: (val) => {
            setSearchQuery(val);
            setPage(1);
        },
        onFilterClick: () => setIsFilterModalOpen(true),
        isFilterApplied: !!(filters.status || filters.category || filters.fromDate || filters.toDate),
        onAddClick: undefined,
        openEditModal: undefined,
        statsData
    };
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            {isMobile ? (
                <LeavesMobileView {...viewProps} />
            ) : (
                <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="mb-6 shrink-0 hidden md:block">
                        <PageHeader title={pageTitle} subtitle={pageSubtitle} />
                    </div>

                    <div className="hidden md:block">
                        <LeaveStatsCards stats={statsData} />
                    </div>

                    <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                        <DataView
                            pageScrollMode={true}
                            data={requests}
                            columns={columns}
                            loading={loading}
                            error={null}
                            searchQuery={searchQuery}
                            onSearchChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            searchPlaceholder="Search requests..."
                            canSelect={false}
                            onRowClick={(item) => setViewId(item.id ?? item._id)}
                            toolbarEndSlot={toolbarEndSlot}
                            page={page}
                            setPage={setPage}
                            limit={limit}
                            setLimit={() => { }}
                            totalItems={totalItems}
                            totalPages={totalPages}
                            emptyText="No leave records found matching your search."
                            className="h-full border-none shadow-none"
                        />
                    </div>
                </div>
            )}

            <FilterLeavesModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                pageTitle={pageTitle}
                isOutPass={!isHomePass}
                isStudent={false}
                isMobile={isMobile}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
                onReset={() => {
                    setFilters({ status: '', category: '', passType: '', fromDate: '', toDate: '' });
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
            />

            <LeaveActionModal
                isOpen={actionModalConfig.isOpen}
                onClose={() => setActionModalConfig({ isOpen: false, actionType: '', request: null })}
                actionType={actionModalConfig.actionType}
                onSubmit={handleConfirmAction}
                isSubmitting={isActionSubmitting}
            />

            <LeaveDetailsModal
                isOpen={!!viewId}
                onClose={() => setViewId(null)}
                leaveId={viewId}
            />
        </div>
    );
}
