import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { visitorApi } from '../../api/visitorApi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';

const checkInSchema = z.object({
    visitorId: z.string().min(1, 'Visitor is required'),
    idProofType: z.string().min(1, 'ID Proof Type is required'),
    idNumber: z.string().min(1, 'ID Number is required'),
    purpose: z.string().min(1, 'Purpose is required'),
    fromTime: z.string().min(1, 'From time is required'),
    toTime: z.string().min(1, 'To time is required'),
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

const CheckInModal = ({ isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: zodResolver(checkInSchema),
    });

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        try {
            await visitorApi.checkInVisitor(data);
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to check in", error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Check In"
            asForm
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="max-w-md"
        >
            <div className="flex flex-col gap-4 mt-2">
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
                    {errors.visitorId && <span className="text-xs text-red-500 mt-1">{errors.visitorId.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="From"
                        type="time" 
                        {...register('fromTime')} 
                        error={errors.fromTime?.message}
                    />
                    <Input 
                        label="To"
                        type="time" 
                        {...register('toTime')} 
                        error={errors.toTime?.message}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <Button 
                    variant="outline" 
                    onClick={onClose}
                    fullWidth={false}
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    fullWidth={false}
                >
                    Check In
                </Button>
            </div>
        </Modal>
    );
};

export default CheckInModal;
