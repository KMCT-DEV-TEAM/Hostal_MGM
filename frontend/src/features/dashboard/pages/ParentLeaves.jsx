import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Filter
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import ListTable from '@/components/ui/ListTable';
import MobileList from '@/components/ui/MobileList';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast } from '@/utils/toast';

const PARENT_MOCK_DATA = [
    {
        id: 'LR001',
        studentName: 'Nila Mohan',
        passType: 'Home Pass',
        fromDate: '2023-10-12',
        toDate: '2023-10-15',
        duration: '3 days',
        reason: 'Family function',
        status: 'Pending',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR002',
        studentName: 'Arjun Mohan',
        passType: 'Out Pass',
        fromDate: '2023-10-20',
        toDate: '2023-10-20',
        outTime: '09:00 AM',
        returnTime: '05:00 PM',
        destination: 'City Mall',
        reason: 'Purchase materials',
        status: 'Approved',
        appliedDate: '2023-10-18'
    }
];

export default function ParentLeaves() {
    const [requests, setRequests] = useState(PARENT_MOCK_DATA);
    const [statusFilter, setStatusFilter] = useState('');

    const stats = useMemo(() => {
        const total = requests.length;
        const approved = requests.filter(r => r.status === 'Approved').length;
        const pending = requests.filter(r => r.status === 'Pending').length;
        const rejected = requests.filter(r => r.status === 'Rejected').length;
        return { total, approved, pending, rejected };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (!statusFilter) return requests;
        return requests.filter(r => r.status === statusFilter);
    }, [requests, statusFilter]);

    const handleUpdateStatus = (id, newStatus) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        showSuccessToast('Status updated successfully');
    };

    const tableHeaders = [
        "Child", "Pass Type", "Applied On", "Period/Date", "Times", "Reason", "Status"
    ];

    const statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    const renderStatusBadge = (status) => {
        const bgClass = status === 'Approved' ? 'bg-[#ECFDF5] border border-[#A7F3D0]' : status === 'Rejected' ? 'bg-[#FEF2F2] border border-[#FEE2E2]' : 'bg-[#FFFBEB] border border-[#FDE68A]';
        const textClass = status === 'Approved' ? 'text-[#065F46]' : status === 'Rejected' ? 'text-[#991B1B]' : 'text-[#92400E]';
        return (
            <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${bgClass} ${textClass}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 flex flex-col">
            <div className="mb-6 shrink-0 flex items-center justify-between">
                <PageHeader
                    title="Leave Requests"
                    subtitle="Monitor and approve leave requests from your children."
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
                <StatsCard
                    label="TOTAL REQUESTS"
                    value={stats.total}
                    icon={<CalendarIcon className="w-4 h-4 text-blue-500" />}
                    iconBg="bg-blue-50/50"
                    borderColor="border-t-2 border-t-blue-500 border-gray-100 shadow-sm"
                />
                <StatsCard
                    label="APPROVED"
                    value={stats.approved}
                    icon={<CalendarIcon className="w-4 h-4 text-success" />}
                    iconBg="bg-green-50/50"
                    borderColor="border-t-2 border-t-green-500 border-gray-100 shadow-sm"
                />
                <StatsCard
                    label="PENDING"
                    value={stats.pending}
                    icon={<CalendarIcon className="w-4 h-4 text-warning" />}
                    iconBg="bg-amber-50/50"
                    borderColor="border-t-2 border-t-amber-500 border-gray-100 shadow-sm"
                />
                <StatsCard
                    label="REJECTED"
                    value={stats.rejected}
                    icon={<CalendarIcon className="w-4 h-4 text-danger" />}
                    iconBg="bg-rose-50/50"
                    borderColor="border-t-2 border-t-rose-500 border-gray-100 shadow-sm"
                />
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                <div className="p-4 flex flex-row items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="font-semibold text-gray-700">Recent Requests</div>
                    <button
                        type="button"
                        onClick={() => setStatusFilter(prev => prev ? '' : 'Pending')}
                        className={`p-3 bg-white border rounded-xl transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center ${statusFilter ? 'border-[#0A437A] text-[#0A437A]' : 'border-gray-200 text-gray-400 hover:text-gray-600'
                            }`}
                        title="Toggle Pending status filter"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>

                <ListTable
                    headers={tableHeaders}
                    items={filteredRequests}
                    canSelect={false}
                    emptyText="No leave records found."
                    renderRow={(r) => (
                        <>
                            <td className="p-4 font-semibold text-gray-700 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                    {r.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <span className="text-sm font-semibold">{r.studentName}</span>
                            </td>
                            <td className="p-4 font-medium text-gray-700">
                                {r.passType}
                            </td>
                            <td className="p-4 text-text-secondary text-sm">
                                {r.appliedDate}
                            </td>
                            <td className="p-4 text-text-secondary text-sm">
                                {r.passType === 'Home Pass' ? `${r.fromDate} to ${r.toDate}` : r.fromDate}
                            </td>
                            <td className="p-4 text-text-secondary text-sm">
                                {r.passType === 'Out Pass' ? `${r.outTime} - ${r.returnTime}` : '-----'}
                            </td>
                            <td className="p-4 text-text-secondary text-sm max-w-[200px] truncate" title={r.reason}>
                                {r.reason}
                            </td>
                            <td className="p-4">
                                {r.status === 'Pending' ? (
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
                                ) : (
                                    renderStatusBadge(r.status)
                                )}
                            </td>
                        </>
                    )}
                />
            </div>
        </div>
    );
}
