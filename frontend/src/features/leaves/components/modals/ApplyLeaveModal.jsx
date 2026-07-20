import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import TimeInput from '@/components/ui/TimeInput';
import Dropdown from '@/components/ui/Dropdown';
import { leaveSchema } from '../../utils/validation';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { createLeave, updateLeave, cancelLeave } from '@/services/leave.service';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess, initialPassType = 'Home Pass', editData }) {
    const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset, watch, setValue } = useForm({
        resolver: zodResolver(leaveSchema),
    });
    const [isWithdrawing, setIsWithdrawing] = React.useState(false);
    
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = React.useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = React.useState(false);
    const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = React.useState(false);
    const [pendingPayload, setPendingPayload] = React.useState(null);

    const fromDateVal = watch('fromDate');
    const toDateVal = watch('toDate');
    const outTimeVal = watch('outTime');
    const returnTimeVal = watch('returnTime');
    const outPassCategoryVal = watch('outPassCategory');

    const outPassCategoryOptions = [
        { label: 'In House', value: 'in_house' },
        { label: 'Out House', value: 'out_house' }
    ];

    // Get today's date in local YYYY-MM-DD format
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                reset({
                    reason: editData.reason || '',
                    fromDate: editData.fromDate ? new Date(editData.fromDate).toISOString().split('T')[0] : (editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''),
                    toDate: editData.toDate ? new Date(editData.toDate).toISOString().split('T')[0] : '',
                    outTime: editData.outTime || '',
                    returnTime: editData.expectedReturnTime || editData.returnTime || '',
                    outPassCategory: editData.outPassCategory || '',
                    passType: editData.passType === 'home_pass' ? 'Home Pass' : 'Out Pass'
                });
            } else {
                reset({
                    reason: '',
                    fromDate: '',
                    toDate: '',
                    outTime: '',
                    returnTime: '',
                    outPassCategory: '',
                    passType: initialPassType
                });
            }
        }
    }, [isOpen, editData, reset]);

    const closeAndReset = () => {
        onClose();
        reset({ reason: '', fromDate: '', toDate: '', outTime: '', returnTime: '', outPassCategory: '', passType: initialPassType });
    };

    const handleCloseModal = () => {
        if (isDirty || editData) {
            setIsDiscardConfirmOpen(true);
        } else {
            closeAndReset();
        }
    };

    const handleFormSubmit = (data) => {
        if (editData) {
            setPendingPayload(data);
            setIsEditConfirmOpen(true);
        } else {
            executeSubmit(data);
        }
    };

    const executeSubmit = async (overrideData) => {
        const data = overrideData || pendingPayload;
        console.log('data:', data);
        try {
            let payload;
            const actualPassType = editData ? (editData.passType === 'home_pass' ? 'Home Pass' : 'Out Pass') : initialPassType;

            if (actualPassType === 'Home Pass') {
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
                    outPassCategory: data.outPassCategory,
                    reason: data.reason
                };
            }

            if (editData) {
                payload.revision = editData.revision ?? editData.__v ?? 0;
                await updateLeave(editData._id, payload);
                showSuccessToast('Leave updated successfully');
            } else {
                await createLeave(payload);
                showSuccessToast('Leave applied successfully');
            }

            setIsEditConfirmOpen(false);
            setPendingPayload(null);
            closeAndReset();
            if (onSuccess) onSuccess();
        } catch (err) {
            showSuccessToast('Leave applied successfully');
            showErrorToast(err.message || 'Failed to apply leave');
        }
    };

    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error.message}</p>;
    };

    const handleWithdrawClick = () => {
        if (!editData) return;
        confirmWithdraw();
    };

    const confirmWithdraw = async () => {
        setIsWithdrawConfirmOpen(false);
        try {
            setIsWithdrawing(true);
            await cancelLeave(editData._id);
            showSuccessToast('Request withdrawn successfully');
            closeAndReset();
            if (onSuccess) onSuccess();
        } catch (err) {
            showErrorToast(err.message || 'Failed to withdraw request');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const inputClasses = (hasError) =>
        `w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors bg-white ${hasError ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
        }`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCloseModal}
            title={editData ? `Edit ${editData.passType === 'home_pass' ? 'Home Pass' : 'Out Pass'}` : `${initialPassType} Request`}
            titleSize="text-lg"
            subtitle={editData ? "Update your leave request" : "Apply for leave"}
            maxWidth="max-w-md"
            asForm
            onSubmit={handleSubmit(handleFormSubmit)}
            footer={
                <div className="flex items-center justify-between w-full">
                    <div>
                        {editData && (
                            <button
                                type="button"
                                onClick={handleWithdrawClick}
                                disabled={isSubmitting || isWithdrawing}
                                className="px-5 py-2 bg-red-50 text-danger border border-danger rounded-md text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                            </button>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={isSubmitting || isWithdrawing}
                            className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {editData ? "Update Request" : "Submit Request"}
                        </button>
                    </div>
                </div>
            }
        >
            <input type="hidden" {...register('passType')} value={editData ? (editData.passType === 'home_pass' ? 'Home Pass' : 'Out Pass') : initialPassType} />
            <div className="grid grid-cols-2 gap-5">
                {(editData ? (editData.passType === 'home_pass' ? 'Home Pass' : 'Out Pass') : initialPassType) === 'Home Pass' ? (
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
                        <div className="col-span-2 grid grid-cols-2 gap-5">
                            <DateInput
                                label="Date"
                                required
                                min={todayStr}
                                error={errors.fromDate}
                                value={fromDateVal}
                                {...register('fromDate')}
                            />
                            <div>
                                <label className="block mb-1.5 text-xs font-medium">Out Pass Category <span className="text-red-500">*</span></label>
                                <Dropdown
                                    options={outPassCategoryOptions}
                                    value={outPassCategoryVal || ''}
                                    onChange={(val) => setValue('outPassCategory', val, { shouldValidate: true, shouldDirty: true })}
                                    placeholder="Select category..."
                                    className="w-full"
                                    minWidth="w-full"
                                    triggerClassName={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors bg-white ${errors.outPassCategory ? "border-red-300 focus:border-red-500 bg-red-50/30 text-red-500" : "border-gray-200 focus:border-secondary text-gray-700"}`}
                                />
                                <input type="hidden" {...register('outPassCategory')} />
                                <ErrorMessage error={errors.outPassCategory} />
                            </div>
                        </div>
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

            <ConfirmationModal
                isOpen={isEditConfirmOpen}
                onClose={() => setIsEditConfirmOpen(false)}
                onConfirm={() => executeSubmit()}
                title="Confirm Edit"
                message="Are you sure you want to save these changes?"
                confirmText="Save Changes"
                isSubmitting={isSubmitting}
            />

            <ConfirmationModal
                isOpen={isDiscardConfirmOpen}
                onClose={() => setIsDiscardConfirmOpen(false)}
                onConfirm={() => {
                    setIsDiscardConfirmOpen(false);
                    closeAndReset();
                }}
                title="Discard Changes"
                message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
                confirmText="Discard"
                cancelText="Continue Editing"
                confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
            />

            <ConfirmationModal
                isOpen={isWithdrawConfirmOpen}
                onClose={() => setIsWithdrawConfirmOpen(false)}
                onConfirm={confirmWithdraw}
                title="Withdraw Request"
                message="Are you sure you want to withdraw this request? This action cannot be undone."
                confirmText="Withdraw"
                confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
                isSubmitting={isWithdrawing}
            />
        </Modal>
    );
}
