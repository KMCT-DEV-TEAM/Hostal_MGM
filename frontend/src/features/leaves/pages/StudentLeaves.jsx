import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Filter, Pencil, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import leaveService from '@/services/leave.service';

// Modular imports
import { formatDate } from '../utils/formatters';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import ApplyLeaveModal from '../components/modals/ApplyLeaveModal';
import FilterLeavesModal from '../components/modals/FilterLeavesModal';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';

export default function StudentLeaves() {
    const { passType } = useParams();
    const isHomePass = passType === 'home-pass' || !passType;
    const pageTitle = isHomePass ? 'Home Pass' : 'Out Pass';
    const pageSubtitle = isHomePass ? 'Manage your leave applications' : 'Manage your permissions requests';

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statsData, setStatsData] = useState({ total: 0, approved: 0, pending: 0 });

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [viewId, setViewId] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const openEditModal = (r) => {
        setEditData(r);
        setIsApplyModalOpen(true);
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await leaveService.getMyLeaves({
                page,
                limit,
                passType: isHomePass ? 'home_pass' : 'out_pass',
                ...(filterStatus !== 'All' && { status: filterStatus.toLowerCase() })
            });
            console.log('response:', res)
            setRequests(res.data);
            setTotalItems(res.pagination.totalRecords);
            setTotalPages(res.pagination.totalPages);

            const passesArray = res.data || res.passes || [];
            setStatsData({
                total: res.pagination?.totalRecords || res.pagination?.total || 0,
                approved: passesArray.filter(r => r.status === 'approved').length,
                pending: passesArray.filter(r => r.status.includes('pending')).length
            });
        } catch (err) {
            console.log(err)
            showErrorToast('Failed to load leaves');
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
    }, [page, isHomePass, filterStatus]);

    const tableHeaders = isHomePass
        ? ["Leave Period", "Days", "Status", "Return", "Action"]
        : ["Date", "Type", "In", "Out", "Status", "Return", "Action"];

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <LeaveStatsCards stats={statsData} isStudent />

            <DataTable
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search"
                toolbarActions={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="p-2.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700 shadow-sm md:shadow-none"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEditData(null); setIsApplyModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors flex-1 sm:flex-none cursor-pointer whitespace-nowrap shadow-sm md:shadow-none"
                        >
                            <Plus className="w-4 h-4" /> Apply
                        </button>
                    </>
                }
                headers={tableHeaders}
                items={requests}
                loading={loading}
                canSelect={false}
                emptyText="No leave records found."
                onRowClick={(item) => setViewId(item._id)}
                renderRow={(r) => (
                    <>
                        {isHomePass ? (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDate(r.fromDate)} - {formatDate(r.toDate)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.totalDays ? `${r.totalDays} days` : '-----'}
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDate(r.date)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass')}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.expectedReturnTime || '-----'}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outTime || '-----'}
                                </td>
                            </>
                        )}
                        <td className="p-4">
                            <LeaveStatusBadge status={r.status} />
                        </td>
                        <td className="p-4">
                            <LeaveReturnBadge returnStatus={r.returnTracking?.returnStatus} />
                        </td>
                        <td className="p-4">
                            {['pending_parent', 'pending_warden', 'approved'].includes(r.status) ? (
                                <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} className="text-accent hover:text-primary transition-colors cursor-pointer relative z-10">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-gray-300 cursor-not-allowed">
                                    <Pencil className="w-4 h-4" />
                                </span>
                            )}
                        </td>
                    </>
                )}
                renderMobileItem={(r) => (
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-sm">
                                {isHomePass ? `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}` : formatDate(r.date)}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : (r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass'))}
                            </span>
                        </div>
                        <hr className="border-gray-50" />
                        <div className="text-xs text-text-secondary space-y-2">
                            {!isHomePass && (
                                <div>{`Outing Time: ${r.outTime || '-----'} - ${r.expectedReturnTime || '-----'}`}</div>
                            )}
                            <div className="flex justify-between items-center gap-2 pt-1">
                                <span className="font-medium text-gray-500">Status:</span>
                                <LeaveStatusBadge status={r.status} />
                            </div>
                            <div className="flex justify-between items-center gap-2">
                                <span className="font-medium text-gray-500">Return:</span>
                                <LeaveReturnBadge returnStatus={r.returnTracking?.returnStatus} />
                            </div>
                        </div>
                        {['pending_parent', 'pending_warden', 'approved'].includes(r.status) && (
                            <div className="flex justify-end pt-2 border-t border-gray-50 mt-2 relative z-10">
                                <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} className="text-accent flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors cursor-pointer p-1">
                                    <Pencil className="w-3.5 h-3.5" /> Edit Request
                                </button>
                            </div>
                        )}
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={totalItems}
                totalPages={totalPages || 1}
            />

            <ApplyLeaveModal
                isOpen={isApplyModalOpen}
                onClose={() => { setIsApplyModalOpen(false); setEditData(null); }}
                onSuccess={fetchLeaves}
                initialPassType={isHomePass ? 'Home Pass' : 'Out Pass'}
                editData={editData}
            />

            <FilterLeavesModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                pageTitle={pageTitle}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                onApply={() => setIsFilterModalOpen(false)}
                onReset={() => { setFilterStatus('All'); setIsFilterModalOpen(false); }}
            />

            <LeaveDetailsModal
                isOpen={!!viewId}
                onClose={() => setViewId(null)}
                leaveId={viewId}
            />
        </div>
    );
}
