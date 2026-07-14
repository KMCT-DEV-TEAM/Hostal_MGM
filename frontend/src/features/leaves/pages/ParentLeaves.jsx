import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast } from '@/utils/toast';

// Modular imports
import FilterLeavesModal from '../components/modals/FilterLeavesModal';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
// import { LeaveStatusBadge, LeaveReturnBadge } from '../components/badges/LeaveBadges';
import InfoCard from '@/components/ui/InfoCard';
import leaveService from '@/services/leave.service';
import { formatDateReadable } from '@/utils/formatters';
import { showErrorToast } from '@/utils/toast';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import LeaveActionModal from '../components/modals/LeaveActionModal';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';

export default function ParentLeaves() {
    const { passType } = useParams();
    const isHomePass = passType === 'home-pass' || !passType;
    const pageTitle = isHomePass ? 'Home Pass Requests' : 'Out Pass Requests';
    const pageSubtitle = isHomePass ? "Manage your children's home pass applications" : "Manage your children's out pass applications";

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statsData, setStatsData] = useState({ total: 0, approved: 0, pending: 0 });

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Action Modal State
    const [actionModalConfig, setActionModalConfig] = useState({ isOpen: false, actionType: '', request: null });
    const [actionRemarks, setActionRemarks] = useState('');
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    // View Modal State
    const [viewId, setViewId] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: '', category: '', fromDate: '', toDate: '' });
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await leaveService.getLeavesByParent({
                page,
                limit,
                passType: isHomePass ? 'home_pass' : 'out_pass',
                ...(searchQuery && { search: searchQuery }),
                ...filters
            });
            const passesArray = res.data || res.passes || [];
            setRequests(passesArray);
            setTotalItems(res.pagination?.totalRecords || res.pagination?.total || 0);
            setTotalPages(res.pagination?.totalPages || res.pagination?.pages || 1);

            setStatsData({
                total: res.pagination?.totalRecords || res.pagination?.total || 0,
                approved: passesArray.filter(r => r.status === 'approved').length,
                pending: passesArray.filter(r => r.status.includes('pending')).length
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
    }, [isHomePass]);

    useEffect(() => {
        fetchLeaves();
    }, [page, isHomePass, filters, searchQuery]);

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
                remarks: remarks,
                revision: request.revision ?? request.__v ?? 0
            };

            if (actionType === 'approved') {
                await leaveService.approveLeaveByParent(request._id, payload);
            } else if (actionType === 'rejected') {
                await leaveService.rejectLeaveByParent(request._id, payload);
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

    const tableHeaders = isHomePass
        ? ["Child", "Leave Period", "Days", "Return", "Status"]
        : ["Child", "Date", "Type", "In", "Out", "Return", "Status"];

    const statusOptions = [
        { label: 'Pending Parent', value: 'pending_parent' },
        { label: 'Approve', value: 'approved' },
        { label: 'Reject', value: 'rejected' }
    ];

    return (
        <div className="w-full h-full overflow-y-auto p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <LeaveStatsCards stats={statsData} />

            <DataTable
                headers={tableHeaders}
                items={requests}
                canSelect={false}
                onRowClick={(item) => setViewId(item._id)}
                emptyText="No requests found."
                renderRow={(r) => (
                    <>
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                                    {getStudentName(r).split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{getStudentName(r)}</span>
                                    {isHomePass && <span className="text-xs text-text-secondary">Applied: {formatDateReadable(r.createdAt)}</span>}
                                </div>
                            </div>
                        </td>

                        {isHomePass ? (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDateReadable(r.fromDate)} - {formatDateReadable(r.toDate)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {getDurationDays(r)} Days
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDateReadable(r.fromDate || r.date)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass')}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.expectedReturnTime || r.returnTime || '--'}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outTime || '--'}
                                </td>
                            </>
                        )}
                        <td className="p-4">
                            <LeaveReturnBadge returnTracking={r.returnTracking} />
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
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
                        </td>
                    </>
                )}
                renderMobileItem={(r) => (
                    <div className="mb-2">
                        <InfoCard
                            avatar={getStudentName(r)}
                            title={getStudentName(r)}
                            subtitle={`Applied: ${formatDateReadable(r.createdAt)}`}
                            fields={[
                                { label: "Date", value: isHomePass ? `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}` : formatDateReadable(r.fromDate || r.date) },
                                { label: "Type/Duration", value: isHomePass ? `${getDurationDays(r)} Days` : (r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass')) },
                                !isHomePass && { label: "Outing Time", value: `${r.outTime || '--'} - ${r.expectedReturnTime || r.returnTime || '--'}` },
                                { label: "Return", value: <LeaveReturnBadge returnTracking={r.returnTracking} /> },
                                {
                                    label: "Status",
                                    value: r.status === 'pending_parent' ? (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Dropdown
                                                options={statusOptions}
                                                value="pending_parent"
                                                onChange={(val) => openActionModal(r, val)}
                                                minWidth="w-32"
                                                triggerClassName="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-warning/10 border-warning/20 text-warning hover:bg-warning/20"
                                            />
                                        </div>
                                    ) : (
                                        <LeaveStatusBadge status={r.status} />
                                    )
                                }
                            ].filter(Boolean)}
                            onClick={() => setViewId(r._id)}
                        />
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={totalItems}
                totalPages={totalPages}
            />

            <FilterLeavesModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                pageTitle={pageTitle}
                isOutPass={!isHomePass}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
                onReset={() => {
                    setFilters({ status: '', category: '', fromDate: '', toDate: '' });
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
