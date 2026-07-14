import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Filter, Pencil, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import leaveService from '@/services/leave.service';

// Modular imports
import { formatDateReadable } from '@/utils/formatters';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import ApplyLeaveModal from '../components/modals/ApplyLeaveModal';
import FilterLeavesModal from '../components/modals/FilterLeavesModal';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import InfoCard from '@/components/ui/InfoCard';

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
    const [filters, setFilters] = useState({ status: '', category: '', fromDate: '', toDate: '' });
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await leaveService.getMyLeaves({
                page,
                limit,
                passType: isHomePass ? 'home_pass' : 'out_pass',
                ...(filters.status && { status: filters.status.toLowerCase() }),
                ...(filters.category && !isHomePass && { outPassCategory: filters.category }),
                ...(filters.fromDate && { startDate: filters.fromDate }),
                ...(filters.toDate && { endDate: filters.toDate })
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
    }, [page, isHomePass, filters.status, filters.category, filters.fromDate, filters.toDate]);

    const tableHeaders = isHomePass
        ? ["Leave Period", "Days", "Status", "Return", "Action"]
        : ["Date", "Type", "In", "Out", "Status", "Return", "Action"];

    return (
        <div className="w-full h-full overflow-y-auto md:overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <LeaveStatsCards stats={statsData} isStudent />

            <DataTable
                onAdd={() => { setEditData(null); setIsApplyModalOpen(true); }}
                addText="Apply"
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
                                    {formatDateReadable(r.fromDate)} - {formatDateReadable(r.toDate)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {console.log('this is new: ', r)}
                                    {r.totalDays ? `${r.totalDays} days` : '-----'}
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDateReadable(r.date)}
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
                            <LeaveReturnBadge returnTracking={r.returnTracking} />
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
                    <div className="mb-2">
                        <InfoCard
                            title={isHomePass ? `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}` : formatDateReadable(r.date)}
                            subtitle={isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : (r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass'))}
                            fields={[
                                !isHomePass && { label: "Outing Time", value: `${r.outTime || '--'} - ${r.expectedReturnTime || '--'}` },
                                { label: "Status", value: <LeaveStatusBadge status={r.status} /> },
                                { label: "Return", value: <LeaveReturnBadge returnTracking={r.returnTracking} /> }
                            ].filter(Boolean)}
                            editable={['pending_parent', 'pending_warden', 'approved'].includes(r.status)}
                            onEdit={() => openEditModal(r)}
                            onClick={() => setViewId(r._id)}
                        />
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={totalItems}
                totalPages={totalPages || 1}
            >
                {/* Custom Toolbar Actions */}
                <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`p-2.5 border rounded-xl transition-colors shadow-sm md:shadow-none flex items-center justify-center ${Object.values(filters).some(Boolean) ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-10 w-10'}`}
                >
                    <Filter className="w-4 h-4" />
                </button>
            </DataTable>

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
                isOutPass={!isHomePass}
                isStudent={true}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setIsFilterModalOpen(false);
                }}
                onReset={() => {
                    setFilters({ status: '', category: '', fromDate: '', toDate: '' });
                    setIsFilterModalOpen(false);
                }}
            />

            <LeaveDetailsModal
                isOpen={!!viewId}
                onClose={() => setViewId(null)}
                leaveId={viewId}
            />
        </div>
    );
}
