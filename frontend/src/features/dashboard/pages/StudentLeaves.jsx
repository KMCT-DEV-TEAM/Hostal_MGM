import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Calendar as CalendarIcon,
    Plus
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import ListTable from '@/components/ui/ListTable';
import MobileList from '@/components/ui/MobileList';
import Modal from '@/components/ui/Modal';
import { showSuccessToast } from '@/utils/toast';

const STUDENT_MOCK_DATA = [
    {
        id: 'LR001',
        passType: 'Home Pass',
        fromDate: '2023-10-12',
        toDate: '2023-10-15',
        duration: '3 days',
        reason: 'Family function',
        status: 'Approved',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR002',
        passType: 'Out Pass',
        fromDate: '2023-10-20',
        toDate: '2023-10-20',
        outTime: '09:00 AM',
        returnTime: '05:00 PM',
        destination: 'City Mall',
        reason: 'Purchase materials',
        status: 'Pending',
        appliedDate: '2023-10-18'
    }
];

const leaveSchema = z.object({
    passType: z.enum(['Home Pass', 'Out Pass']),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().optional(),
    outTime: z.string().optional(),
    returnTime: z.string().optional(),
    destination: z.string().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
}).superRefine((data, ctx) => {
    if (data.passType === 'Home Pass') {
        if (!data.toDate) {
            ctx.addIssue({ path: ['toDate'], message: 'To date is required for Home Pass', code: z.ZodIssueCode.custom });
        }
    }
    if (data.passType === 'Out Pass') {
        if (!data.outTime) {
            ctx.addIssue({ path: ['outTime'], message: 'Out time is required for Out Pass', code: z.ZodIssueCode.custom });
        }
        if (!data.returnTime) {
            ctx.addIssue({ path: ['returnTime'], message: 'Return time is required for Out Pass', code: z.ZodIssueCode.custom });
        }
        if (!data.destination) {
            ctx.addIssue({ path: ['destination'], message: 'Destination is required for Out Pass', code: z.ZodIssueCode.custom });
        }
    }
});

export default function StudentLeaves() {
    const [requests, setRequests] = useState(STUDENT_MOCK_DATA);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            passType: 'Home Pass'
        }
    });

    const passTypeVal = watch('passType');

    const onSubmit = (data) => {
        const newReq = {
            id: `LR00${requests.length + 1}`,
            passType: data.passType,
            fromDate: data.fromDate,
            toDate: data.passType === 'Home Pass' ? data.toDate : data.fromDate,
            duration: data.passType === 'Home Pass' ? 'TBD' : '-----',
            outTime: data.outTime,
            returnTime: data.returnTime,
            destination: data.destination,
            reason: data.reason,
            status: 'Pending',
            appliedDate: new Date().toISOString().split('T')[0]
        };
        setRequests([newReq, ...requests]);
        showSuccessToast('Leave request submitted successfully');
        setIsModalOpen(false);
        reset();
    };

    const stats = useMemo(() => {
        const total = requests.length;
        const approved = requests.filter(r => r.status === 'Approved').length;
        const pending = requests.filter(r => r.status === 'Pending').length;
        const rejected = requests.filter(r => r.status === 'Rejected').length;
        return { total, approved, pending, rejected };
    }, [requests]);

    const tableHeaders = [
        "Pass Type", "Applied On", "Period/Date", "Times", "Reason", "Status"
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
                    title="My Leaves"
                    subtitle="View your leave history and apply for new passes."
                />
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Apply Leave
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
                <StatsCard
                    label="TOTAL APPLIED"
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
                <ListTable
                    headers={tableHeaders}
                    items={requests}
                    canSelect={false}
                    emptyText="No leave records found."
                    renderRow={(r) => (
                        <>
                            <td className="p-4 font-semibold text-gray-700">
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
                                {renderStatusBadge(r.status)}
                            </td>
                        </>
                    )}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); reset(); }}
                title="Apply Leave"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                        <select
                            {...register('passType')}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                            <option value="Home Pass">Home Pass</option>
                            <option value="Out Pass">Out Pass</option>
                        </select>
                    </div>

                    {passTypeVal === 'Home Pass' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    {...register('fromDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    {...register('toDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {errors.toDate && <p className="text-red-500 text-xs mt-1">{errors.toDate.message}</p>}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    {...register('fromDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Out Time</label>
                                    <input
                                        type="time"
                                        {...register('outTime')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    {errors.outTime && <p className="text-red-500 text-xs mt-1">{errors.outTime.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                                    <input
                                        type="time"
                                        {...register('returnTime')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    {errors.returnTime && <p className="text-red-500 text-xs mt-1">{errors.returnTime.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                <input
                                    type="text"
                                    {...register('destination')}
                                    placeholder="Where are you going?"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>}
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <textarea
                            {...register('reason')}
                            rows={3}
                            placeholder="Please provide a reason..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        ></textarea>
                        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsModalOpen(false); reset(); }}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
