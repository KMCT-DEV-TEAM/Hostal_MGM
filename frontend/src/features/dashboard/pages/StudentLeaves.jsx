import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Filter,
    Search,
    CheckCircle2,
    XCircle,
    Pencil,
    Plus
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import ListTable from '@/components/ui/ListTable';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast } from '@/utils/toast';

const STUDENT_MOCK_DATA = [
    {
        id: 'LR001',
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
        passType: 'Out Pass',
        fromDate: 'june 12',
        type: 'In House',
        outTime: '10 : 00 AM',
        returnTime: '09 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned',
        appliedDate: '2023-10-18'
    },
    {
        id: 'LR007',
        passType: 'Out Pass',
        fromDate: 'june 12',
        type: 'In House',
        outTime: '10 : 00 AM',
        returnTime: '09 : 00 AM',
        status: 'Approved',
        returnStatus: 'Not Returned',
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
            ctx.addIssue({ path: ['toDate'], message: 'To date is required', code: z.ZodIssueCode.custom });
        }
    }
    if (data.passType === 'Out Pass') {
        if (!data.outTime) {
            ctx.addIssue({ path: ['outTime'], message: 'Out time is required', code: z.ZodIssueCode.custom });
        }
        if (!data.returnTime) {
            ctx.addIssue({ path: ['returnTime'], message: 'Return time is required', code: z.ZodIssueCode.custom });
        }
        if (!data.destination) {
            ctx.addIssue({ path: ['destination'], message: 'Destination is required', code: z.ZodIssueCode.custom });
        }
    }
});

export default function StudentLeaves() {
    const { passType } = useParams();
    const isHomePass = passType === 'home-pass' || !passType;
    const pageTitle = isHomePass ? 'Home Pass' : 'Out Pass';
    const pageSubtitle = isHomePass ? 'Manage your leave applications' : 'Manage your permissions requests';

    const [requests, setRequests] = useState(STUDENT_MOCK_DATA);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
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
        return requests.filter(item => item.passType === typeFilter);
    }, [requests, isHomePass]);

    const paginatedList = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredList.slice(start, start + limit);
    }, [filteredList, page]);

    const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: { passType: isHomePass ? 'Home Pass' : 'Out Pass' }
    });

    const passTypeVal = watch('passType');

    const onSubmit = (data) => {
        const newReq = {
            id: `LR00${requests.length + 1}`,
            passType: data.passType,
            fromDate: data.fromDate,
            toDate: data.passType === 'Home Pass' ? data.toDate : data.fromDate,
            duration: data.passType === 'Home Pass' ? 'TBD' : '-----',
            type: 'In House',
            outTime: data.outTime,
            returnTime: data.returnTime,
            destination: data.destination,
            reason: data.reason,
            status: 'Pending',
            returnStatus: '-----',
            appliedDate: new Date().toISOString().split('T')[0]
        };
        setRequests([newReq, ...requests]);
        showSuccessToast('Leave request submitted successfully');
        setIsApplyModalOpen(false);
        reset();
    };

    const stats = useMemo(() => {
        const total = filteredList.length;
        const approved = filteredList.filter(r => r.status === 'Approved').length;
        const pending = filteredList.filter(r => r.status === 'Pending').length;
        return { total: 10, approved: isHomePass ? 7 : 9, pending: isHomePass ? 3 : 10 }; // Hardcoded to match screenshots for demo
    }, [filteredList, isHomePass]);

    const tableHeaders = isHomePass
        ? ["Leave Period", "Days", "Status", "Return", "Action"]
        : ["Date", "Type", "In", "Out", "Status", "Return", "Action"];

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
                            placeholder="Search"
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
                        <button
                            type="button"
                            onClick={() => { reset(); setIsApplyModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors flex-1 sm:flex-none cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Apply
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
                                    {renderStatusBadge(r.status)}
                                </td>
                                <td className="p-4">
                                    {renderReturnBadge(r.returnStatus)}
                                </td>
                                <td className="p-4">
                                    <button className="text-accent hover:text-primary transition-colors cursor-pointer">
                                        <Pencil className="w-4 h-4" />
                                    </button>
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

            {/* Apply Leave Modal */}
            <Modal
                isOpen={isApplyModalOpen}
                onClose={() => { setIsApplyModalOpen(false); reset(); }}
                title="Apply Leave"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                        <Dropdown
                            options={[
                                { label: 'Home Pass', value: 'Home Pass' },
                                { label: 'Out Pass', value: 'Out Pass' }
                            ]}
                            value={passTypeVal}
                            onChange={(val) => setValue('passType', val, { shouldValidate: true })}
                            triggerClassName="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex justify-between items-center"
                        />
                    </div>

                    {passTypeVal === 'Home Pass' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    {...register('fromDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {errors.fromDate && <p className="text-danger text-xs mt-1">{errors.fromDate.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    {...register('toDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {errors.toDate && <p className="text-danger text-xs mt-1">{errors.toDate.message}</p>}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    {...register('fromDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {errors.fromDate && <p className="text-danger text-xs mt-1">{errors.fromDate.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Out Time</label>
                                    <input
                                        type="time"
                                        {...register('outTime')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    {errors.outTime && <p className="text-danger text-xs mt-1">{errors.outTime.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                                    <input
                                        type="time"
                                        {...register('returnTime')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    {errors.returnTime && <p className="text-danger text-xs mt-1">{errors.returnTime.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                <input
                                    type="text"
                                    {...register('destination')}
                                    placeholder="Where are you going?"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {errors.destination && <p className="text-danger text-xs mt-1">{errors.destination.message}</p>}
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <textarea
                            {...register('reason')}
                            rows={3}
                            placeholder="Please provide a reason..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        ></textarea>
                        {errors.reason && <p className="text-danger text-xs mt-1">{errors.reason.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsApplyModalOpen(false); reset(); }}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Filter Modal */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title={`Filter ${pageTitle} requests`}
                subtitle={`Filter specific ${pageTitle} Requests from the list`}
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
