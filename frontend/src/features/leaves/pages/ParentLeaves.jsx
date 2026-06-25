import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast } from '@/utils/toast';

// Modular imports
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import leaveService from '@/services/leave.service';
import { formatDate } from '../utils/formatters';
import { showErrorToast } from '@/utils/toast';

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

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await leaveService.getLeavesByParent({
                page,
                limit,
                passType: isHomePass ? 'home_pass' : 'out_pass',
                ...(filterStatus !== 'All' && { status: filterStatus.toLowerCase() }),
                ...(searchQuery && { search: searchQuery })
            });
            setRequests(res.passes);
            setTotalItems(res.pagination.total);
            setTotalPages(res.pagination.pages);

            setStatsData({
                total: res.pagination.total,
                approved: res.passes.filter(r => r.status === 'approved').length,
                pending: res.passes.filter(r => r.status.includes('pending')).length
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
    }, [page, isHomePass, filterStatus, searchQuery]);

    const openActionModal = (request, actionType) => {
        if (actionType === 'pending') return;
        setActionModalConfig({ isOpen: true, actionType, request });
        setActionRemarks('');
    };

    const handleConfirmAction = async (e) => {
        e?.preventDefault();
        const { actionType, request } = actionModalConfig;

        if (actionType === 'rejected' && !actionRemarks.trim()) {
            showErrorToast('Remarks are required for rejection');
            return;
        }

        try {
            setIsActionSubmitting(true);
            const payload = {
                remarks: actionRemarks,
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
            showErrorToast(err.message || `Failed to ${actionType} pass`);
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const getDisplayStatus = (status) => {
        if (!status) return 'pending_parent';
        return status;
    };

    const getStudentName = (r) => {
        return r.studentId?.name || r.studentName || 'Student';
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
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <LeaveStatsCards stats={statsData} />

            <DataTable
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search"
                toolbarActions={
                    <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2.5 bg-white border rounded-xl hover:bg-gray-50 transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 ${filterStatus !== 'All' ? 'border-[#0A437A] text-primary' : 'border-gray-200 text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                }
                headers={tableHeaders}
                items={requests}
                canSelect={false}
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
                                    {isHomePass && <span className="text-xs text-text-secondary">Applied: {formatDate(r.createdAt)}</span>}
                                </div>
                            </div>
                        </td>

                        {isHomePass ? (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDate(r.fromDate)} - {formatDate(r.toDate)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.totalDays} Days
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDate(r.fromDate)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    Out Pass
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.returnTime || '--'}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outTime || '--'}
                                </td>
                            </>
                        )}
                        <td className="p-4">
                            <LeaveReturnBadge returnStatus={r.returnTracking?.returnStatus || 'pending'} />
                        </td>
                        <td className="p-4">
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
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                {getStudentName(r).split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">{getStudentName(r)}</h4>
                                <span className="text-xs text-text-secondary">Applied: {formatDate(r.createdAt)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                            <span className="font-bold text-gray-700 text-sm">
                                {isHomePass ? `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}` : formatDate(r.fromDate)}
                            </span>
                            <span className="text-xs text-text-secondary font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                {isHomePass ? `${r.totalDays} Days` : 'Out Pass'}
                            </span>
                        </div>

                        <div className="text-sm text-text-secondary space-y-2.5 pt-1">
                            {!isHomePass && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-500">Outing Time:</span>
                                    <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded">{r.outTime || '--'} - {r.returnTime || '--'}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                                <span className="font-medium text-gray-500 text-xs">Approval Status:</span>
                                {r.status === 'pending_parent' ? (
                                    <Dropdown
                                        options={statusOptions}
                                        value="pending_parent"
                                        onChange={(val) => openActionModal(r, val)}
                                        minWidth="w-[120px]"
                                        triggerClassName="px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors bg-warning/10 border-warning/20 text-warning hover:bg-warning/20"
                                    />
                                ) : (
                                    <LeaveStatusBadge status={r.status} />
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500 text-xs">Return Status:</span>
                                <LeaveReturnBadge returnStatus={r.returnTracking?.returnStatus || 'pending'} />
                            </div>
                        </div>
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={totalItems}
                totalPages={totalPages}
            />

            {/* Filter Modal */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title={`Filter ${pageTitle}`}
                subtitle="Filter requests by their current status"
                maxWidth="max-w-xs"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="All">All Status</option>
                            <option value="pending_parent">Pending Parent</option>
                            <option value="pending_warden">Pending Warden</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            onClick={() => { setFilterStatus('All'); setIsFilterModalOpen(false); }}
                            className="px-6 py-2.5 text-sm font-semibold text-primary bg-white border border-primary rounded-xl hover:bg-gray-50 transition-colors w-full"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors w-full"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Action Confirmation Modal */}
            <Modal
                isOpen={actionModalConfig.isOpen}
                onClose={() => setActionModalConfig({ isOpen: false, actionType: '', request: null })}
                title={actionModalConfig.actionType === 'approved' ? 'Approve Pass Request' : 'Reject Pass Request'}
                subtitle={`Provide remarks for this ${actionModalConfig.actionType === 'approved' ? 'approval' : 'rejection'}.`}
                maxWidth="max-w-md"
                asForm
                onSubmit={handleConfirmAction}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Remarks {actionModalConfig.actionType === 'rejected' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={actionRemarks}
                            onChange={(e) => setActionRemarks(e.target.value)}
                            required={actionModalConfig.actionType === 'rejected'}
                            placeholder={actionModalConfig.actionType === 'rejected' ? "Please explain why this pass is rejected..." : "Optional remarks..."}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-y"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setActionModalConfig({ isOpen: false, actionType: '', request: null })}
                            disabled={isActionSubmitting}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isActionSubmitting || (actionModalConfig.actionType === 'rejected' && !actionRemarks.trim())}
                            className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors w-full ${actionModalConfig.actionType === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isActionSubmitting ? 'Processing...' : actionModalConfig.actionType === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
