import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import TimeInput from '@/components/ui/TimeInput';
import { leaveSchema } from '../../utils/validation';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { createLeave } from '@/services/leave.service';

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess, initialPassType = 'Home Pass' }) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
        resolver: zodResolver(leaveSchema),
    });

    const fromDateVal = watch('fromDate');
    const toDateVal = watch('toDate');
    const outTimeVal = watch('outTime');
    const returnTimeVal = watch('returnTime');
    
    // Get today's date in local YYYY-MM-DD format
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit = async (data) => {
        try {
            let payload;
            if (initialPassType === 'Home Pass') {
                payload = {
                    ...data,
                    passType: 'home_pass',
                    totalDays: Math.ceil((new Date(data.toDate) - new Date(data.fromDate)) / (1000 * 60 * 60 * 24))
                };
            } else {
                payload = {
                    passType: 'out_pass',
                    date: data.fromDate,
                    outTime: data.outTime,
                    expectedReturnTime: data.returnTime,
                    reason: data.reason
                };
            }
            await createLeave(payload);
            showSuccessToast('Leave applied successfully');
            onClose();
            reset();
            if (onSuccess) onSuccess();
        } catch (err) {
            showErrorToast(err.message || 'Failed to apply leave');
        }
    };

    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error.message}</p>;
    };

    const inputClasses = (hasError) =>
        `w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors bg-white ${hasError ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
        }`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); reset(); }}
            title={`${initialPassType} Request`}
            titleSize="text-lg"
            subtitle="Apply for leave"
            maxWidth="max-w-md"
            asForm
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Submit Request
                    </button>
                    <button
                        type="button"
                        onClick={() => { onClose(); reset(); }}
                        disabled={isSubmitting}
                        className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            }
        >
            <input type="hidden" {...register('passType')} value={initialPassType} />
            <div className="grid grid-cols-2 gap-5">
                {initialPassType === 'Home Pass' ? (
                    <>
                        <DateInput
                            label="From Date"
                            required
                            min={todayStr}
                            max={toDateVal || undefined}
                            error={errors.fromDate}
                            value={fromDateVal}
                            {...register('fromDate')}
                        />
                        <DateInput
                            label="To Date"
                            required
                            min={fromDateVal || todayStr}
                            error={errors.toDate}
                            value={toDateVal}
                            {...register('toDate')}
                        />
                    </>
                ) : (
                    <>
                        <DateInput
                            className="col-span-2"
                            label="Date"
                            required
                            min={todayStr}
                            error={errors.fromDate}
                            value={fromDateVal}
                            {...register('fromDate')}
                        />
                        <TimeInput
                            label="Out Time"
                            required
                            max={returnTimeVal || undefined}
                            error={errors.outTime}
                            {...register('outTime')}
                        />
                        <TimeInput
                            label="Return Time"
                            required
                            min={outTimeVal || undefined}
                            error={errors.returnTime}
                            {...register('returnTime')}
                        />
                    </>
                )}

                <div className="col-span-2">
                    <label className="block mb-1.5 text-xs font-medium">Reason <span className="text-red-500">*</span></label>
                    <textarea
                        {...register('reason')}
                        rows={3}
                        placeholder="Please provide a reason..."
                        className={`w-full py-2 px-3 border rounded-md text-xs outline-none transition-colors bg-white resize-none ${errors.reason ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
                            }`}
                    ></textarea>
                    <ErrorMessage error={errors.reason} />
                </div>
            </div>
        </Modal>
    );
}
