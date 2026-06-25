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
    Plus,
    Download
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import ListTable from '@/components/ui/ListTable';
import MobileList from '@/components/ui/MobileList';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import leaveService from '@/services/leave.service';

const formatDate = (dateString) => {
    if (!dateString) return '-----';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};


const leaveSchema = z.object({
    passType: z.enum(['Home Pass', 'Out Pass']),
    fromDate: z.string().min(1, 'Date is required'),
    toDate: z.string().optional(),
    outTime: z.string().optional(),
    returnTime: z.string().optional(),
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
    }
});

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
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
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
            setRequests(res.passes);
            setTotalItems(res.pagination.totalRecords);
            setTotalPages(res.pagination.totalPages);

            // Temporary local stats counting based on fetched data 
            // Replace with real stats endpoint if backend adds one
            setStatsData({
                total: res.pagination.totalRecords,
                approved: res.passes.filter(r => r.status === 'approved').length,
                pending: res.passes.filter(r => r.status.includes('pending')).length
            });
        } catch (err) {
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

    const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: { passType: isHomePass ? 'Home Pass' : 'Out Pass' }
    });

    const passTypeVal = watch('passType');

    const onSubmit = async (data) => {
        try {
            const payload = {
                passType: data.passType === 'Home Pass' ? 'home_pass' : 'out_pass',
                reason: data.reason
            };
            if (data.passType === 'Home Pass') {
                payload.fromDate = new Date(data.fromDate).toISOString();
                payload.toDate = new Date(data.toDate).toISOString();

                const start = new Date(data.fromDate);
                const end = new Date(data.toDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                payload.totalDays = diffDays;
            } else {
                payload.date = new Date(data.fromDate).toISOString();
                payload.outTime = data.outTime;
                payload.expectedReturnTime = data.returnTime;
            }

            await leaveService.createLeave(payload);
            showSuccessToast('Leave request submitted successfully');
            setIsApplyModalOpen(false);
            reset();
            fetchLeaves(); // Refresh data
        } catch (error) {
            showErrorToast(error.message || 'Failed to submit request');
        }
    };

    const stats = useMemo(() => {
        return statsData;
    }, [statsData]);

    const tableHeaders = isHomePass
        ? ["Leave Period", "Days", "Status", "Return", "Action"]
        : ["Date", "Type", "In", "Out", "Status", "Return", "Action"];

    const renderStatusBadge = (status) => {
        const s = status ? status.toLowerCase() : '';
        const isApproved = s === 'approved';
        const isRejected = s === 'rejected' || s === 'cancelled';
        const bgClass = isApproved ? 'bg-success/10' : isRejected ? 'bg-danger/10' : 'bg-warning/10';
        const textClass = isApproved ? 'text-success' : isRejected ? 'text-danger' : 'text-warning';
        const displayStatus = s.replace('_', ' ');
        return (
            <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize ${bgClass} ${textClass}`}>
                {displayStatus}
            </span>
        );
    };

    const renderReturnBadge = (returnStatus) => {
        if (!returnStatus || returnStatus === 'pending') {
            return <span className="text-gray-400 font-semibold">-----</span>;
        }
        if (returnStatus === 'on_time') {
            return (
                <span className="px-3.5 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> On Time
                </span>
            );
        }
        if (returnStatus === 'late') {
            return (
                <span className="px-3.5 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Late
                </span>
            );
        }
        return <span className="text-gray-400 font-semibold capitalize">{returnStatus.replace('_', ' ')}</span>;
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

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                <div className="p-4 flex flex-row items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="relative w-full max-w-sm">
                        <input
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none placeholder-gray-400 font-medium text-gray-700"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700 shadow-sm md:shadow-none"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => showSuccessToast('Exporting leave data...')}
                            className="hidden md:flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            type="button"
                            onClick={() => { reset(); setIsApplyModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors flex-1 sm:flex-none cursor-pointer whitespace-nowrap shadow-sm md:shadow-none"
                        >
                            <Plus className="w-4 h-4" /> Apply
                        </button>
                    </div>
                </div>

                {/* Desktop Grid Layout */}
                <ListTable
                    headers={tableHeaders}
                    items={requests}
                    loading={loading}
                    canSelect={false}
                    emptyText="No leave records found."
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
                                        In House
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
                                {renderStatusBadge(r.status)}
                            </td>
                            <td className="p-4">
                                {renderReturnBadge(r.returnTracking?.returnStatus)}
                            </td>
                            <td className="p-4">
                                <button className="text-accent hover:text-primary transition-colors cursor-pointer">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </td>
                        </>
                    )}
                />

                {/* Mobile View */}
                <MobileList
                    items={requests}
                    loading={loading}
                    canSelect={false}
                    emptyText="No leave records found."
                    renderItem={(r) => (
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-700 text-sm">
                                    {isHomePass ? `${formatDate(r.fromDate)} - ${formatDate(r.toDate)}` : formatDate(r.date)}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                    {isHomePass ? (r.totalDays ? `${r.totalDays} days` : '-----') : 'In House'}
                                </span>
                            </div>
                            <hr className="border-gray-50" />
                            <div className="text-xs text-text-secondary space-y-2">
                                {!isHomePass && (
                                    <div>{`Outing Time: ${r.outTime || '-----'} - ${r.expectedReturnTime || '-----'}`}</div>
                                )}
                                <div className="flex justify-between items-center gap-2 pt-1">
                                    <span className="font-medium text-gray-500">Status:</span>
                                    {renderStatusBadge(r.status)}
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-medium text-gray-500">Return:</span>
                                    {renderReturnBadge(r.returnTracking?.returnStatus)}
                                </div>
                            </div>
                        </div>
                    )}
                />

                <Pagination
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    totalItems={totalItems}
                    totalPages={totalPages || 1}
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
