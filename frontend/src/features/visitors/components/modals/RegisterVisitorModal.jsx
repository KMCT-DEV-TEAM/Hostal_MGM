import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createVisitorProfile, updateVisitorProfile, getVisitorDetails, getVisitorDetailsParent, reuseVisitorProfile } from '@/services/visitor.service';
import { getParentStudents } from '@/services/parent.service';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { registerSchema, editSchema } from '@/features/visitors/validation/visitorSchema';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useActiveStudent } from '@/hooks/useActiveStudent';

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
    const { user } = useAuthStore();
    const { activeStudentId } = useActiveStudent();
    const isEditMode = !!initialData;
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    
    const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    
    // For handling 409 conflict (reusing existing visitor)
    const [existingVisitor, setExistingVisitor] = useState(null);
    const [isReuseConfirmOpen, setIsReuseConfirmOpen] = useState(false);

    const { register, handleSubmit, control, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
        resolver: zodResolver(isEditMode ? editSchema : registerSchema),
        defaultValues: {
            idProofType: ID_PROOF_TYPES.AADHAAR
        }
    });

    useEffect(() => {
        if (isOpen && !isEditMode && activeStudentId) {
            setSelectedStudentIds([activeStudentId]);
        }
        
        const fetchParentStudents = async () => {
            if (isOpen && !isEditMode && user?.role === 'parent') {
                try {
                    const data = await getParentStudents({ hostelStatus: 'active' });
                    
                    // Handle both standard { data: [...] } format and the flat numeric-keyed format
                    let studentsArray = [];
                    if (Array.isArray(data?.data)) {
                        studentsArray = data.data;
                    } else if (Array.isArray(data)) {
                        studentsArray = data;
                    } else if (typeof data === 'object' && data !== null) {
                        studentsArray = Object.values(data).filter(val => 
                            val && typeof val === 'object' && val._id
                        );
                    }
                    
                    setAvailableStudents(studentsArray);
                } catch (error) {
                    console.error('Failed to fetch parent students:', error);
                }
            }
        };
        fetchParentStudents();
    }, [isOpen, isEditMode, activeStudentId, user?.role]);

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
                            let response;
                            if (user?.role === 'parent') {
                                response = await getVisitorDetailsParent(visitorId, activeStudentId);
                            } else {
                                response = await getVisitorDetails(visitorId);
                            }
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
                        idProofNumber: '',
                        purpose: '',
                        remarks: ''
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

    const toggleStudentSelection = (studentId) => {
        if (studentId === activeStudentId) return; // Prevent deselecting primary student
        setSelectedStudentIds(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const handleFormSubmit = (data) => {
        setPendingPayload(data);
        if (isEditMode) {
            setIsEditConfirmOpen(true);
        } else {
            setIsCreateConfirmOpen(true);
        }
    };

    const extractStudentId = (student) => {
        if (!student) return null;
        if (typeof student === 'object') return student._id || student.id;
        return student;
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
                const allowedFields = ['name', 'address', 'email'];
                payload = {};
                allowedFields.forEach(field => {
                    if (data[field] !== undefined) {
                        payload[field] = data[field];
                    }
                });
                if (user?.role === 'parent') payload.studentId = activeStudentId;
            } else {
                payload = {
                    ...data,
                    studentIds: user?.role === 'parent' ? selectedStudentIds : [extractStudentId(user.studentId)]
                };
                if (user?.role === 'parent') payload.studentId = activeStudentId;
            }

            if (isEditMode) {
                const visitorId = initialData.visitorId || initialData._id || initialData.id;
                await updateVisitorProfile(visitorId, payload);
                showSuccessToast("Visitor updated successfully!");
                setIsEditConfirmOpen(false);
                setPendingPayload(null);
                reset();
                onSuccess();
                onClose();
            } else {
                await createVisitorProfile(payload);
                showSuccessToast("Visitor registered successfully!");
                setIsCreateConfirmOpen(false);
                setPendingPayload(null);
                reset();
                onSuccess();
                onClose();
            }

        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'register'} visitor`, error);
            
            // The Axios interceptor throws an ApiError with .status and .data
            const status = error?.status || error?.response?.status;
            const errorData = error?.data || error?.response?.data;

            if (!isEditMode && status === 409 && errorData?.error === 'VISITOR_EXISTS') {
                setIsCreateConfirmOpen(false);
                setExistingVisitor(errorData.visitor);
                setIsReuseConfirmOpen(true);
            } else {
                showErrorToast(errorData?.message || error.message || `Failed to ${isEditMode ? 'update' : 'register'} visitor`);
            }
        } finally {
            setIsApiLoading(false);
        }
    };

    const executeReuseSubmit = async () => {
        setIsApiLoading(true);
        try {
            const data = pendingPayload;
            const payload = {
                studentIds: user?.role === 'parent' ? selectedStudentIds : [extractStudentId(user.studentId)],
                studentId: activeStudentId,
                visitorId: existingVisitor.id || existingVisitor._id,
                relationship: data.relationship,
                purpose: data.purpose,
                remarks: data.remarks
            };

            await reuseVisitorProfile(payload);
            showSuccessToast("Visit requests successfully submitted for existing visitor.");
            
            setIsReuseConfirmOpen(false);
            setExistingVisitor(null);
            setPendingPayload(null);
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to reuse visitor profile", error);
            const errorData = error?.data || error?.response?.data;
            showErrorToast(errorData?.message || error.message || "Failed to reuse visitor profile");
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
                        disabled={isEditMode}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Phone Number"
                        {...register('phone')}
                        placeholder="+919876543210"
                        error={errors.phone?.message}
                        disabled={isEditMode}
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
                                isEditMode ? (
                                    <Input
                                        value={field.value}
                                        disabled
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none transition-colors text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed"
                                    />
                                ) : (
                                    <Dropdown
                                        options={idProofOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select ID Type"
                                        triggerClassName="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
                                    />
                                )
                            )}
                        />
                        {errors.idProofType && <span className="text-xs text-red-500 mt-1">{errors.idProofType.message}</span>}
                    </div>
                    <Input
                        label="ID Proof Number"
                        {...register('idProofNumber')}
                        placeholder="1234-5678-9012"
                        error={errors.idProofNumber?.message}
                        disabled={isEditMode}
                    />
                </div>
                
                {!isEditMode && (
                    <>
                        <Input
                            label="Purpose of Visit"
                            {...register('purpose')}
                            placeholder="Monthly visit"
                            error={errors.purpose?.message}
                        />
                        <Input
                            label="Remarks (Optional)"
                            {...register('remarks')}
                            placeholder="Bringing food"
                            error={errors.remarks?.message}
                        />
                    </>
                )}

                {/* Sibling Selection Section */}
                {!isEditMode && user?.role === 'parent' && availableStudents.length > 1 && (
                    <div className="mt-2 border-t border-gray-100 pt-4">
                        <label className="block mb-3 text-sm text-text-primary font-medium">
                            Link Additional Siblings (Optional)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableStudents.map(student => {
                                const isPrimary = student._id === activeStudentId || student.id === activeStudentId;
                                const studentId = student._id || student.id;
                                const isSelected = selectedStudentIds.includes(studentId);
                                return (
                                    <div 
                                        key={studentId}
                                        onClick={() => toggleStudentSelection(studentId)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'} ${isPrimary ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-text-primary">{student.name}</span>
                                            {isPrimary && <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Primary</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
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
        
        {existingVisitor && (
            <ConfirmationModal
                isOpen={isReuseConfirmOpen}
                onClose={() => {
                    setIsReuseConfirmOpen(false);
                    setExistingVisitor(null);
                }}
                onConfirm={executeReuseSubmit}
                title="Existing Visitor Found"
                message={
                    <div className="flex flex-col gap-2 mt-2">
                        <p className="text-sm text-text-secondary">
                            A visitor with this identity already exists in the system. Would you like to link this visit request to the existing profile?
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-text-secondary font-medium">Name</span>
                                <span className="text-sm font-semibold text-text-primary">{existingVisitor.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-text-secondary font-medium">Phone</span>
                                <span className="text-sm font-medium text-text-primary">{existingVisitor.phone}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-text-secondary font-medium">ID Proof</span>
                                <span className="text-sm font-medium text-text-primary">{existingVisitor.idProofType} ({existingVisitor.idProofNumber})</span>
                            </div>
                        </div>
                    </div>
                }
                confirmText="Yes, use this visitor"
                cancelText="Cancel"
                isSubmitting={isApiLoading}
            />
        )}
        </>
    );
};

export default RegisterVisitorModal;
