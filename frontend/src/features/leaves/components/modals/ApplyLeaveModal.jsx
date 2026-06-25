import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import { leaveSchema } from '../../utils/validation';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import leaveService from '@/services/leave.service';

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess, initialPassType = 'Home Pass' }) {
    const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            passType: initialPassType
        }
    });

    const passTypeVal = watch('passType');

    // Reset form when modal opens with new initialPassType
    useEffect(() => {
        if (isOpen) {
            reset({ passType: initialPassType });
        }
    }, [isOpen, initialPassType, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                passType: data.passType === 'Home Pass' ? 'home_pass' : 'out_pass',
                totalDays: data.passType === 'Home Pass' ? 
                    Math.ceil((new Date(data.toDate) - new Date(data.fromDate)) / (1000 * 60 * 60 * 24)) : undefined
            };
            await leaveService.applyLeave(payload);
            showSuccessToast('Leave applied successfully');
            onClose();
            reset();
            if (onSuccess) onSuccess();
        } catch (err) {
            showErrorToast('Failed to apply leave');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); reset(); }}
            title="Apply Leave"
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                    <select
                        {...register('passType')}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        onClick={() => { onClose(); reset(); }}
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
    );
}
