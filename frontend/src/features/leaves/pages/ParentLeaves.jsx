import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Filter,
    Search,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import ListTable from '@/components/ui/ListTable';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast } from '@/utils/toast';

const PARENT_MOCK_DATA = [
    {
        id: 'LR001',
        studentName: 'Nila Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Pending',
        returnStatus: '-----',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR002',
        studentName: 'Nila Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Approved',
        returnStatus: 'Returned',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR003',
        studentName: 'Arjun Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Pending',
        returnStatus: '-----',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR004',
        studentName: 'Arjun Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Approved',
        returnStatus: 'Not Returned',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR005',
        studentName: 'Nila Mohan',
        passType: 'Out Pass',
        fromDate: 'june 12',
        type: 'In House',
        outTime: '10 : 00 AM',
        returnTime: '09 : 00 AM',
        status: 'Pending',
        returnStatus: '-----',
        appliedDate: '2023-10-18'
    },
    {
        id: 'LR006',
        studentName: 'Arjun Mohan',
        passType: 'Out Pass',
        fromDate: 'june 12',
        type: 'In House',
        outTime: '10 : 00 AM',
        returnTime: '09 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned',
        appliedDate: '2023-10-18'
    }
];

export default function ParentLeaves() {
    const { passType } = useParams();
    const isHomePass = passType === 'home-pass' || !passType;
    const pageTitle = isHomePass ? 'Home Pass Requests' : 'Out Pass Requests';
    const pageSubtitle = isHomePass ? "Manage your children's home pass applications" : "Manage your children's out pass applications";
    
    const [requests, setRequests] = useState(PARENT_MOCK_DATA);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Approved');
    const [page, setPage] = useState(1);
    const limit = 5;

    useEffect(() => {
        setSearchQuery('');
        setPage(1);
    }, [isHomePass]);

    const filteredList = useMemo(() => {
        const typeFilter = isHomePass ? 'Home Pass' : 'Out Pass';
        let list = requests.filter(item => item.passType === typeFilter);
        if (searchQuery) {
            list = list.filter(item => item.studentName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return list;
    }, [requests, isHomePass, searchQuery]);

    const paginatedList = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredList.slice(start, start + limit);
    }, [filteredList, page]);

    const stats = useMemo(() => {
        const total = filteredList.length;
        const approved = filteredList.filter(r => r.status === 'Approved').length;
        const pending = filteredList.filter(r => r.status === 'Pending').length;
        return { total, approved, pending };
    }, [filteredList]);

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

    const renderStatusBadge = (status) => {
        const bgClass = status === 'Approved' ? 'bg-success/10' : status === 'Rejected' ? 'bg-danger/10' : 'bg-warning/10';
        const textClass = status === 'Approved' ? 'text-success' : status === 'Rejected' ? 'text-danger' : 'text-warning';
        return (
            <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${bgClass} ${textClass}`}>
                {status}
            </span>
        );
    };

    const renderReturnBadge = (returnStatus) => {
        if (returnStatus === 'Returned') {
            return (
                <span className="px-3.5 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Returned
                </span>
            );
        }
        if (returnStatus === 'Not Returned') {
            return (
                <span className="px-3.5 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Not Returned
                </span>
            );
        }
        return <span className="text-gray-400 font-semibold">-----</span>;
    };

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader
                    title={pageTitle}
                    subtitle={pageSubtitle}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 shrink-0">
                <StatsCard
                    label="TOTAL REQUESTS"
                    value={stats.total}
                    icon={<CalendarIcon className="w-4 h-4 text-primary" />}
                    iconBg="bg-primary/10"
                    borderColor="border-t-2 border-t-primary"
                />
                <StatsCard
                    label="APPROVED REQUESTS"
                    value={stats.approved}
                    icon={<CalendarIcon className="w-4 h-4 text-success" />}
                    iconBg="bg-success/10"
                    borderColor="border-t-2 border-t-success"
                />
                <StatsCard
                    label="PENDING REQUESTS"
                    value={stats.pending}
                    icon={<CalendarIcon className="w-4 h-4 text-warning" />}
                    iconBg="bg-warning/10"
                    borderColor="border-t-2 border-t-warning"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                <div className="p-4 flex flex-row items-center justify-between gap-4 border-b border-gray-50 shrink-0">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder-gray-400 font-medium text-gray-700"
                            placeholder="Search Child"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <ListTable
                        headers={tableHeaders}
                        items={paginatedList}
                        canSelect={false}
                        emptyText="No leave records found."
                        renderRow={(r) => (
                            <>
                                <td className="p-4 font-semibold text-gray-700 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                        {r.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <span className="text-sm font-semibold">{r.studentName}</span>
                                </td>
                                {isHomePass ? (
                                    <>
                                        <td className="p-4 text-text-secondary text-sm">
                                            {r.fromDate} - {r.toDate}
                                        </td>
                                        <td className="p-4 text-text-secondary text-sm">
                                            {r.duration}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 text-text-secondary text-sm">
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
                                    {renderReturnBadge(r.returnStatus)}
                                </td>
                                <td className="p-4">
                                    {r.status === 'Pending' ? (
                                        <Dropdown
                                            options={statusOptions}
                                            value={r.status}
                                            onChange={(val) => handleUpdateStatus(r.id, val)}
                                            minWidth="w-28"
                                            triggerClassName={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.status === 'Approved' ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' :
                                                r.status === 'Rejected' ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20' :
                                                    'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
                                                }`}
                                        />
                                    ) : (
                                        renderStatusBadge(r.status)
                                    )}
                                </td>
                            </>
                        )}
                    />
                </div>
                
                <Pagination
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    totalItems={filteredList.length}
                    totalPages={Math.ceil(filteredList.length / limit) || 1}
                />
            </div>

            {/* Filter Modal */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title={`Filter ${pageTitle}`}
                subtitle={`Filter specific ${pageTitle} from the list`}
                maxWidth="max-w-sm"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">From</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">To</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                        <Dropdown
                            options={[
                                { label: 'Approved', value: 'Approved' },
                                { label: 'Pending', value: 'Pending' },
                                { label: 'Rejected', value: 'Rejected' }
                            ]}
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val)}
                            triggerClassName="w-1/2 px-4 py-2.5 bg-success/5 border border-transparent rounded-xl text-sm text-success font-medium flex justify-between items-center"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-semibold text-primary bg-white border border-primary rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Filter
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
