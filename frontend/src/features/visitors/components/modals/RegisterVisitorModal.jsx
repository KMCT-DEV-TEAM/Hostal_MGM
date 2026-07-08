import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { visitorApi } from '../../api/visitorApi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email('Valid email is required'),
    address: z.string().min(1, 'Address is required'),
    idProofType: z.string().min(1, 'ID Proof Type is required'),
    idProofNumber: z.string().min(1, 'ID Proof Number is required'),
});

const idProofOptions = [
    { value: 'Aadhaar', label: 'Aadhaar Card' },
    { value: 'PAN', label: 'PAN Card' },
    { value: 'Driving License', label: 'Driving License' },
    { value: 'Passport', label: 'Passport' }
];

const RegisterVisitorModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore()
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            idProofType: 'Aadhaar'
        }
    });

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        try {
            // Include dummy student ID for now as it's required by the backend payload
            const payload = {
                ...data,
                students: [user.studentId]
            };
            await visitorApi.createVisitorProfile(payload);
            showSuccessToast("Visitor registered successfully!");
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to register visitor", error);
            showErrorToast(error.message || "Failed to register visitor");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Register Visitor"
            asForm
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="max-w-xl"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} fullWidth={false} size='sm'>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth={false} size='sm' isLoading={isSubmitting} disabled={isSubmitting}>
                        Register
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Visitor Name"
                        {...register('name')}
                        placeholder="John Doe"
                        error={errors.name?.message}
                    />
                    <Input
                        label="Relationship"
                        {...register('relationship')}
                        placeholder="Uncle"
                        error={errors.relationship?.message}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Phone Number"
                        {...register('phone')}
                        placeholder="+919876543210"
                        error={errors.phone?.message}
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        {...register('email')}
                        placeholder="john.doe@example.com"
                        error={errors.email?.message}
                    />
                </div>

                <Input
                    label="Address"
                    {...register('address')}
                    placeholder="123 Street Name"
                    error={errors.address?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm text-text-primary font-medium">ID Proof Type</label>
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
                    <Input
                        label="ID Proof Number"
                        {...register('idProofNumber')}
                        placeholder="1234-5678-9012"
                        error={errors.idProofNumber?.message}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default RegisterVisitorModal;
