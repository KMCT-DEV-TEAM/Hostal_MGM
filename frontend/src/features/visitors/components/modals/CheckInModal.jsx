import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { visitorApi } from '../../api/visitorApi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TimeInput from '@/components/ui/TimeInput';
import Dropdown from '@/components/ui/Dropdown';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const checkInSchema = z.object({
    visitorId: z.string().min(1, 'Visitor is required'),
    idProofType: z.string().optional(),
    idNumber: z.string().optional(),
    purpose: z.string().min(1, 'Purpose is required'),
    expectedExitTime: z.string().min(1, 'Expected return time is required'),
});

const visitorOptions = [
    { value: 'v1', label: 'Kiran Kumar' },
    { value: 'v2', label: 'John Doe' }
];

const idProofOptions = [
    { value: 'Aadhar Card', label: 'Aadhar Card' },
    { value: 'PAN Card', label: 'PAN Card' },
    { value: 'Driving License', label: 'Driving License' }
];

const CheckInModal = ({ isOpen, onClose, onSuccess, prefilledVisitor }) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [isApiLoading, setIsApiLoading] = useState(false);

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue } = useForm({
        resolver: zodResolver(checkInSchema),
    });

    useEffect(() => {
        if (prefilledVisitor && isOpen) {
            setValue('visitorId', prefilledVisitor.visitorId || prefilledVisitor._id || prefilledVisitor.id);
            setValue('idProofType', prefilledVisitor.idProofType || '');
            setValue('idNumber', prefilledVisitor.idProofNumber || '');
        }
    }, [prefilledVisitor, isOpen, setValue]);

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setPendingPayload(data);
        setIsConfirmOpen(true);
    };

    const executeSubmit = async () => {
        const data = pendingPayload;
        setIsApiLoading(true);
        try {
            const now = new Date();
            const [hours, minutes] = data.expectedExitTime.split(':');
            now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

            const payload = {
                visitor: {
                    refId: data.visitorId,
                    refType: prefilledVisitor?.refType || 'Visitor'
                },
                purpose: data.purpose,
                expectedExitTime: now.toISOString()
            };

            await visitorApi.checkInVisitor(payload);
            showSuccessToast('Visitor checked in successfully');
            setIsConfirmOpen(false);
            setPendingPayload(null);
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to check in", error);
            showErrorToast('Failed to check in', error.message || 'Something went wrong');
        } finally {
            setIsApiLoading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Check In"
                asForm
                onSubmit={handleSubmit(onSubmit)}
                maxWidth="max-w-md"
            >
                <div className="flex flex-col gap-4 mt-2">
                    {prefilledVisitor ? (
                        <div>
                            <label className="block mb-2 text-sm text-text-primary font-medium">Visitor</label>
                            <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 text-sm font-medium">
                                {prefilledVisitor.visitorName || prefilledVisitor.name}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block mb-2 text-sm text-text-primary font-medium">Visitor</label>
                            <Controller
                                name="visitorId"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        options={visitorOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Visitor"
                                        triggerClassName="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
                                    />
                                )}
                            />
                            {errors.visitorId && <span className="text-xs text-danger mt-1">{errors.visitorId.message}</span>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {prefilledVisitor ? (
                            <>
                                <div>
                                    <label className="block mb-2 text-sm text-text-primary font-medium">Id Proof Type</label>
                                    <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 text-sm font-medium uppercase">
                                        {prefilledVisitor.idProofType || '--'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm text-text-primary font-medium">Id Number</label>
                                    <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 text-sm font-medium font-mono">
                                        {prefilledVisitor.idProofNumber || '--'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block mb-2 text-sm text-text-primary font-medium">Id Proof Type</label>
                                    <Controller
                                        name="idProofType"
                                        control={control}
                                        render={({ field }) => (
                                            <Dropdown
                                                options={idProofOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select ID Type"
                                                triggerClassName="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
                                            />
                                        )}
                                    />
                                    {errors.idProofType && <span className="text-xs text-red-500 mt-1">{errors.idProofType.message}</span>}
                                </div>
                                <div>
                                    <Input
                                        label="Id Number"
                                        {...register('idNumber')}
                                        placeholder="1234 5678 9012"
                                        error={errors.idNumber?.message}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 text-sm text-text-primary font-medium">Visiting Purpose *</label>
                        <textarea
                            {...register('purpose')}
                            placeholder="Enter text here..."
                            rows="2"
                            className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none ${errors.purpose ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'}`}
                        ></textarea>
                        {errors.purpose && <span className="text-xs text-red-500 mt-1">{errors.purpose.message}</span>}
                    </div>

                    <div>
                        <TimeInput
                            label="Expected Return Time *"
                            {...register('expectedExitTime')}
                            error={errors.expectedExitTime?.message}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Check In
                    </Button>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeSubmit}
                title="Confirm Check-In"
                message="Are you sure you want to check in this visitor?"
                confirmText="Check In"
                isSubmitting={isApiLoading}
            />
        </>
    );
};

export default CheckInModal;
