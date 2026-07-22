import React, { useEffect, useState } from 'react';
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
import { registerSchema } from '@/features/visitors/validation/visitorSchema';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export const ID_PROOF_TYPES = {
    AADHAAR: 'Aadhaar',
    PAN_CARD: 'PAN Card',
    VOTER_ID: 'Voter ID',
    DRIVING_LICENSE: 'Driving License',
    PASSPORT: 'Passport',
};

const idProofOptions = [
    { value: ID_PROOF_TYPES.AADHAAR, label: 'Aadhaar' },
    { value: ID_PROOF_TYPES.PAN_CARD, label: 'PAN Card' },
    { value: ID_PROOF_TYPES.VOTER_ID, label: 'Voter ID' },
    { value: ID_PROOF_TYPES.DRIVING_LICENSE, label: 'Driving License' },
    { value: ID_PROOF_TYPES.PASSPORT, label: 'Passport' },
];

const RegisterVisitorModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const { user } = useAuthStore()
    const isEditMode = !!initialData;
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    
    const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [isApiLoading, setIsApiLoading] = useState(false);

    const { register, handleSubmit, control, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            idProofType: ID_PROOF_TYPES.AADHAAR
        }
    });

    useEffect(() => {
        const fetchDetails = async () => {
            if (isOpen) {
                if (initialData) {
                    const visitorId = initialData.visitorId || initialData._id || initialData.id;

                    // First set whatever data we already have
                    reset({
                        name: initialData.visitorName || initialData.name || '',
                        relationship: initialData.relationship || initialData.relation || '',
                        phone: initialData.phone || '',
                        email: initialData.email || '',
                        address: initialData.address || '',
                        idProofType: initialData.idProofType || ID_PROOF_TYPES.AADHAAR,
                        idProofNumber: initialData.idProofNumber || ''
                    });

                    // Then fetch full details if we are missing fields
                    if (visitorId) {
                        try {
                            setIsLoadingDetails(true);
                            const response = await visitorApi.getVisitorDetails(visitorId);
                            const fullData = response.data?.data || response.data || {};

                            reset({
                                name: fullData.name || fullData.visitorName || initialData.visitorName || initialData.name || '',
                                relationship: fullData.relationship || fullData.relation || initialData.relationship || initialData.relation || '',
                                phone: fullData.phone || initialData.phone || '',
                                email: fullData.email || initialData.email || '',
                                address: fullData.address || initialData.address || '',
                                idProofType: fullData.idProofType || initialData.idProofType || ID_PROOF_TYPES.AADHAAR,
                                idProofNumber: fullData.idProofNumber || initialData.idProofNumber || ''
                            });
                        } catch (error) {
                            console.error('Failed to fetch visitor details:', error);
                        } finally {
                            setIsLoadingDetails(false);
                        }
                    }
                } else {
                    reset({
                        name: '',
                        relationship: '',
                        phone: '',
                        email: '',
                        address: '',
                        idProofType: ID_PROOF_TYPES.AADHAAR,
                        idProofNumber: ''
                    });
                }
            }
        };
        fetchDetails();
    }, [isOpen, initialData, reset]);

    if (!isOpen) return null;

    const handleCloseModal = () => {
        if (isDirty) {
            setIsDiscardConfirmOpen(true);
        } else {
            onClose();
        }
    };

    const handleFormSubmit = (data) => {
        setPendingPayload(data);
        if (isEditMode) {
            setIsEditConfirmOpen(true);
        } else {
            setIsCreateConfirmOpen(true);
        }
    };

    const executeSubmit = async () => {
        const data = pendingPayload;
        setIsApiLoading(true);
        try {
            // Extract student ID correctly in case user.studentId is a populated object
            const extractStudentId = (student) => {
                if (!student) return null;
                if (typeof student === 'object') return student._id || student.id;
                return student;
            };

            let payload;
            
            if (isEditMode) {
                const allowedFields = ['name', 'relationship', 'idProofType', 'idProofNumber', 'address', 'email', 'phone'];
                payload = {};
                allowedFields.forEach(field => {
                    if (data[field] !== undefined) {
                        payload[field] = data[field];
                    }
                });
            } else {
                payload = {
                    ...data,
                    students: [extractStudentId(user.studentId)]
                };
            }

            if (isEditMode) {
                const visitorId = initialData.visitorId || initialData._id || initialData.id;
                await visitorApi.updateVisitorProfile(visitorId, payload);
                showSuccessToast("Visitor updated successfully!");
            } else {
                await visitorApi.createVisitorProfile(payload);
                showSuccessToast("Visitor registered successfully!");
            }

            setIsCreateConfirmOpen(false);
            setIsEditConfirmOpen(false);
            setPendingPayload(null);
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'register'} visitor`, error);
            showErrorToast(error.message || `Failed to ${isEditMode ? 'update' : 'register'} visitor`);
        } finally {
            setIsApiLoading(false);
        }
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={handleCloseModal}
            title={isEditMode ? "Edit Visitor Details" : "Register New Visitor"}
            maxWidth="max-w-2xl"
            asForm
            onSubmit={handleSubmit(handleFormSubmit)}
            footer={
                <>
                    <Button variant="outline" onClick={handleCloseModal} fullWidth={false} size='sm' disabled={isLoadingDetails}>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth={false} size='sm' isLoading={isSubmitting || isLoadingDetails} disabled={isSubmitting || isLoadingDetails}>
                        {isEditMode ? "Update" : "Register"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4 mt-2">
                {isLoadingDetails && (
                    <div className="text-sm text-blue-600 mb-2 animate-pulse">
                        Loading visitor details...
                    </div>
                )}
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
        
        <ConfirmationModal
            isOpen={isCreateConfirmOpen}
            onClose={() => setIsCreateConfirmOpen(false)}
            onConfirm={executeSubmit}
            title="Confirm Registration"
            message="Are you sure you want to register this visitor?"
            confirmText="Register"
            isSubmitting={isApiLoading}
        />
        <ConfirmationModal
            isOpen={isEditConfirmOpen}
            onClose={() => setIsEditConfirmOpen(false)}
            onConfirm={executeSubmit}
            title="Confirm Update"
            message="Are you sure you want to update this visitor's details?"
            confirmText="Update"
            isSubmitting={isApiLoading}
        />
        <ConfirmationModal
            isOpen={isDiscardConfirmOpen}
            onClose={() => setIsDiscardConfirmOpen(false)}
            onConfirm={() => {
                setIsDiscardConfirmOpen(false);
                onClose();
            }}
            title="Discard Changes"
            message="Are you sure you want to discard your changes?"
            confirmText="Discard"
            cancelText="Continue Editing"
            confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
        />
        </>
    );
};

export default RegisterVisitorModal;
