import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import { leaveSchema } from '../../utils/validation';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { createLeave } from '@/services/leave.service';

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess, initialPassType = 'Home Pass' }) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: zodResolver(leaveSchema),
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                passType: initialPassType === 'Home Pass' ? 'home_pass' : 'out_pass',
                totalDays: initialPassType === 'Home Pass' ?
                    Math.ceil((new Date(data.toDate) - new Date(data.fromDate)) / (1000 * 60 * 60 * 24)) : undefined
            };
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
                        <div>
                            <label className="block mb-1.5 text-xs font-medium">From Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                {...register('fromDate')}
                                className={inputClasses(errors.fromDate)}
                            />
                            <ErrorMessage error={errors.fromDate} />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-medium">To Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                {...register('toDate')}
                                className={inputClasses(errors.toDate)}
                            />
                            <ErrorMessage error={errors.toDate} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2">
                            <label className="block mb-1.5 text-xs font-medium">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                {...register('fromDate')}
                                className={inputClasses(errors.fromDate)}
                            />
                            <ErrorMessage error={errors.fromDate} />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-medium">Out Time <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                {...register('outTime')}
                                className={inputClasses(errors.outTime)}
                            />
                            <ErrorMessage error={errors.outTime} />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-medium">Return Time <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                {...register('returnTime')}
                                className={inputClasses(errors.returnTime)}
                            />
                            <ErrorMessage error={errors.returnTime} />
                        </div>
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
