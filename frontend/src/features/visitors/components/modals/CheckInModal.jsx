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
    selectedStudentIds: z.array(z.string()).min(1, 'Select at least one student to visit'),
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
        defaultValues: {
            selectedStudentIds: []
        }
    });

    useEffect(() => {
        if (prefilledVisitor && isOpen) {
            setValue('visitorId', prefilledVisitor.visitorId || prefilledVisitor._id || prefilledVisitor.id);
            setValue('idProofType', prefilledVisitor.idProofType || '');
            setValue('idNumber', prefilledVisitor.idProofNumber || '');

            const studentsList = prefilledVisitor.linkedStudents || prefilledVisitor.students;
            if (studentsList && studentsList.length > 0) {
                const studentIds = studentsList.map(s => s.id || s._id);
                setValue('selectedStudentIds', studentIds);
            } else {
                setValue('selectedStudentIds', []);
            }
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
                selectedStudentIds: data.selectedStudentIds,
                purpose: data.purpose,
                expectedExitTime: now.toISOString()
            };

            await visitorApi.checkInVisitor(payload);
            showSuccessToast('Visitor checked in successfully');
            setIsConfirmOpen(false);
            setPendingPayload(null);
            reset();
            if (onSuccess) onSuccess();
            if (onClose) onClose();
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
                maxWidth="max-w-xl"
            >
                <div className="flex flex-col gap-4 mt-2">
                    {prefilledVisitor ? (
                        <div className='mb-2'>
                            <label className="block mb-1 text-sm text-text-primary font-medium">Visitor</label>
                            <div className="w-full px-3.5 py-2 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 text-[13px] font-medium">
                                {prefilledVisitor.visitorName || prefilledVisitor.name}
                            </div>
                        </div>
                    ) : (
                        <div className='mb-2'>
                            <label className="block mb-1 text-sm text-text-primary font-medium">Visitor</label>
                            <Controller
                                name="visitorId"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        options={visitorOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Visitor"
                                        triggerClassName="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-[13px]"
                                    />
                                )}
                            />
                            {errors.visitorId && <span className="text-xs text-danger mt-1">{errors.visitorId.message}</span>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {prefilledVisitor ? (
                            <>
                                <div className='mb-2'>
                                    <label className="block mb-1 text-sm text-text-primary font-medium">Id Proof Type</label>
                                    <div className="w-full px-3.5 py-2 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 text-[13px] font-medium uppercase">
                                        {prefilledVisitor.idProofType || '--'}
                                    </div>
                                </div>
                                <div className='mb-2'>
                                    <label className="block mb-1 text-sm text-text-primary font-medium">Id Number</label>
                                    <div className="w-full px-3.5 py-2 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 text-[13px] font-medium font-mono">
                                        {prefilledVisitor.idProofNumber || '--'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className='mb-2'>
                                    <label className="block mb-1 text-sm text-text-primary font-medium">Id Proof Type</label>
                                    <Controller
                                        name="idProofType"
                                        control={control}
                                        render={({ field }) => (
                                            <Dropdown
                                                options={idProofOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select ID Type"
                                                triggerClassName="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-[13px]"
                                            />
                                        )}
                                    />
                                    {errors.idProofType && <span className="text-xs text-danger mt-1">{errors.idProofType.message}</span>}
                                </div>
                                <div className='mb-2'>
                                    <Input
                                        label="Id Number"
                                        {...register('idNumber')}
                                        placeholder="1234 5678 9012"
                                        error={errors.idNumber?.message}
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[13px]"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {(prefilledVisitor?.linkedStudents || prefilledVisitor?.students) && (prefilledVisitor.linkedStudents || prefilledVisitor.students).length > 1 && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <label className="block mb-1 text-sm text-text-primary font-medium">Visiting Students *</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                <Controller
                                    name="selectedStudentIds"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            {(prefilledVisitor.linkedStudents || prefilledVisitor.students).map((student) => {
                                                const sId = student.id || student._id;
                                                return (
                                                    <label key={sId} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                            checked={field.value?.includes(sId)}
                                                            onChange={(e) => {
                                                                const current = field.value || [];
                                                                if (e.target.checked) {
                                                                    field.onChange([...current, studentId]);
                                                                } else {
                                                                    field.onChange(current.filter(id => id !== studentId));
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-800">{student.name}</span>
                                                            {student.roomNumber && <span className="text-xs text-gray-500">Room: {student.roomNumber}</span>}
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </>
                                    )}
                                />
                            </div>
                            {errors.selectedStudentIds && <span className="text-xs text-danger mt-1">{errors.selectedStudentIds.message}</span>}
                        </div>
                    )}

                    <div>
                        <label className="block mb-1 text-sm text-text-primary font-medium">Visiting Purpose *</label>
                        <textarea
                            {...register('purpose')}
                            placeholder="Enter text here..."
                            rows="2"
                            className={`w-full border rounded-lg px-3.5 py-2 text-[13px] focus:ring-2 focus:ring-primary/20 outline-none resize-none ${errors.purpose ? 'border-danger focus:border-danger' : 'border-slate-300 focus:border-primary'}`}
                        ></textarea>
                        {errors.purpose && <span className="text-xs text-danger mt-1">{errors.purpose.message}</span>}
                    </div>

                    <div>
                        <TimeInput
                            label="Expected Return Time *"
                            {...register('expectedExitTime')}
                            error={errors.expectedExitTime?.message}
                            className="py-2! text-[13px]!"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button type="button" variant="outline" size='md' fullWidth={false} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" size='md' fullWidth={false}>
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
