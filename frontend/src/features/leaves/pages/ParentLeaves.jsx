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
import { PARENT_MOCK_DATA } from '../utils/mockData';

export default function ParentLeaves() {
    const { passType } = useParams();
    const isHomePass = passType === 'home-pass' || !passType;
    const pageTitle = isHomePass ? 'Home Pass Requests' : 'Out Pass Requests';
    const pageSubtitle = isHomePass ? "Manage your children's home pass applications" : "Manage your children's out pass applications";

    const [requests, setRequests] = useState(PARENT_MOCK_DATA);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 5;

    useEffect(() => {
        setSearchQuery('');
        setPage(1);
    }, [isHomePass]);

    const filteredList = useMemo(() => {
        const typeFilter = isHomePass ? 'Home Pass' : 'Out Pass';
        let list = requests.filter(item => item.passType === typeFilter);
        if (filterStatus !== 'All') {
            list = list.filter(item => item.status === filterStatus);
        }
        if (searchQuery) {
            list = list.filter(item => item.studentName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return list;
    }, [requests, isHomePass, searchQuery, filterStatus]);

    const paginatedList = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredList.slice(start, start + limit);
    }, [filteredList, page]);

    const stats = useMemo(() => {
        const total = requests.filter(r => r.passType === (isHomePass ? 'Home Pass' : 'Out Pass')).length;
        const approved = requests.filter(r => r.passType === (isHomePass ? 'Home Pass' : 'Out Pass') && r.status === 'Approved').length;
        const pending = requests.filter(r => r.passType === (isHomePass ? 'Home Pass' : 'Out Pass') && r.status === 'Pending').length;
        return { total, approved, pending };
    }, [requests, isHomePass]);

    const handleUpdateStatus = (id, newStatus) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        showSuccessToast('Status updated successfully');
    };

    const tableHeaders = isHomePass
        ? ["Child", "Leave Period", "Days", "Return", "Status"]
        : ["Child", "Date", "Type", "In", "Out", "Return", "Status"];

    const statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <LeaveStatsCards stats={stats} />

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
                items={paginatedList}
                canSelect={false}
                emptyText="No requests found."
                renderRow={(r) => (
                    <>
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                                    {r.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{r.studentName}</span>
                                    {isHomePass && <span className="text-xs text-text-secondary">Applied: {r.appliedDate}</span>}
                                </div>
                            </div>
                        </td>

                        {isHomePass ? (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {r.fromDate} - {r.toDate}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.duration}
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {r.fromDate}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.type}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.returnTime}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outTime}
                                </td>
                            </>
                        )}
                        <td className="p-4">
                            <LeaveReturnBadge returnStatus={r.returnStatus} />
                        </td>
                        <td className="p-4">
                            <Dropdown
                                options={statusOptions}
                                value={r.status}
                                onChange={(val) => handleUpdateStatus(r.id, val)}
                                minWidth="w-28"
                                triggerClassName={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.status === 'Approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#d1fae5]' :
                                        r.status === 'Rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B] hover:bg-[#fee2e2]' :
                                            'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#fef3c7]'
                                    }`}
                            />
                        </td>
                    </>
                )}
                renderMobileItem={(r) => (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                {r.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">{r.studentName}</h4>
                                <span className="text-xs text-text-secondary">Applied: {r.appliedDate}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                            <span className="font-bold text-gray-700 text-sm">
                                {isHomePass ? `${r.fromDate} - ${r.toDate}` : r.fromDate}
                            </span>
                            <span className="text-xs text-text-secondary font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                {isHomePass ? r.duration : r.type}
                            </span>
                        </div>

                        <div className="text-sm text-text-secondary space-y-2.5 pt-1">
                            {!isHomePass && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-500">Outing Time:</span>
                                    <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded">{r.outTime} - {r.returnTime}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                                <span className="font-medium text-gray-500 text-xs">Approval Status:</span>
                                <Dropdown
                                    options={statusOptions}
                                    value={r.status}
                                    onChange={(val) => handleUpdateStatus(r.id, val)}
                                    minWidth="w-[120px]"
                                    triggerClassName={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.status === 'Approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                                            r.status === 'Rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]' :
                                                'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                                        }`}
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500 text-xs">Return Status:</span>
                                <LeaveReturnBadge returnStatus={r.returnStatus} />
                            </div>
                        </div>
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={filteredList.length}
                totalPages={Math.ceil(filteredList.length / limit) || 1}
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
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
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
        </div>
    );
}
