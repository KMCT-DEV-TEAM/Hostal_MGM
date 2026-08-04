import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getParentStudents } from '@/services/parent.service';
import { reuseVisitorProfile } from '@/services/visitor.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useActiveStudent } from '@/hooks/useActiveStudent';

const assignSchema = z.object({
    relationship: z.string().min(2, "Relationship is required").max(50),
    purpose: z.string().min(3, "Purpose must be at least 3 characters").max(255),
    remarks: z.string().max(500).optional(),
});

export default function AssignStudentModal({ isOpen, onClose, visitor, visitorId, onSuccess }) {
    const { activeStudentId } = useActiveStudent();
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            relationship: '',
            purpose: '',
            remarks: ''
        }
    });

    useEffect(() => {
        if (isOpen) {
            const fetchStudents = async () => {
                setIsLoadingStudents(true);
                try {
                    const data = await getParentStudents({ hostelStatus: 'active' });

                    let studentsArray = [];
                    if (Array.isArray(data?.data)) {
                        studentsArray = data.data;
                    } else if (Array.isArray(data)) {
                        studentsArray = data;
                    } else if (typeof data === 'object' && data !== null) {
                        studentsArray = Object.values(data).filter(val => val && typeof val === 'object' && val._id);
                    }

                    // Filter out students already actively linked to the visitor
                    const linkedStudents = visitor?.linkedStudents || visitor?.students || [];

                    // Only hide students that are currently active or pending
                    const activeLinkedStudents = linkedStudents.filter(s => {
                        const status = (s.requestStatus || s.status || '').toLowerCase();
                        return status !== 'cancelled' && status !== 'unassigned' && status !== 'rejected';
                    });

                    const linkedIds = new Set(
                        activeLinkedStudents.flatMap(s => [
                            s._id?.toString(),
                            s.id?.toString(),
                            s.studentId?.toString(),
                            s.student?._id?.toString()
                        ].filter(Boolean))
                    );

                    const unlinkedStudents = studentsArray.filter(s => {
                        const sIds = [
                            s._id?.toString(),
                            s.id?.toString(),
                            s.studentId?.toString()
                        ].filter(Boolean);

                        return !sIds.some(id => linkedIds.has(id));
                    });

                    setAvailableStudents(unlinkedStudents);
                    setSelectedStudentIds([]);
                    reset({
                        relationship: visitor?.relationship || '',
                        purpose: '',
                        remarks: ''
                    });
                } catch (error) {
                    console.error('Failed to fetch parent students:', error);
                } finally {
                    setIsLoadingStudents(false);
                }
            };
            fetchStudents();
        }
    }, [isOpen, visitor, reset]);

    const toggleStudentSelection = (studentId) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const onSubmit = async (data) => {
        if (selectedStudentIds.length === 0) {
            showErrorToast("Please select at least one student to assign.");
            return;
        }

        try {
            const payload = {
                studentId: activeStudentId, // Context routing
                visitorId: visitorId,
                studentIds: selectedStudentIds,
                relationship: data.relationship,
                purpose: data.purpose,
                remarks: data.remarks
            };

            await reuseVisitorProfile(payload);
            showSuccessToast("Visitor assigned successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to assign visitor:", error);
            const errorMsg = error?.response?.data?.message || error?.data?.message || "Failed to assign visitor";
            showErrorToast(errorMsg);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Visitor to Students"
            maxWidth="max-w-xl"
            asForm
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
                    <Button variant="outline" onClick={onClose} fullWidth={false} size='sm' disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth={false} size='sm' isLoading={isSubmitting} disabled={isSubmitting || selectedStudentIds.length === 0}>
                        Assign to Selected
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4 mt-2">
                <div className="bg-secondary/5 border border-secondary/20 p-3 rounded-lg flex items-center gap-2 mb-2">
                    <span className="text-sm text-secondary">
                        Assigning visitor <strong>{visitor?.visitorName || visitor?.name}</strong> to additional students.
                    </span>
                </div>

                <div>
                    <label className="block mb-2 text-sm text-text-primary font-medium">
                        Select Students *
                    </label>
                    {isLoadingStudents ? (
                        <div className="text-sm text-gray-500 animate-pulse">Loading students...</div>
                    ) : availableStudents.length === 0 ? (
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            No active, unlinked students available.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableStudents.map(student => {
                                const studentId = student._id || student.id;
                                const isSelected = selectedStudentIds.includes(studentId);
                                return (
                                    <div
                                        key={studentId}
                                        onClick={() => toggleStudentSelection(studentId)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-text-primary">{student.name}</span>
                                            <span className="text-[10px] text-text-secondary uppercase">{student.courseName}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Input
                    label="Relationship *"
                    {...register('relationship')}
                    placeholder="e.g., Uncle, Aunt, Guardian"
                    error={errors.relationship?.message}
                />
                <Input
                    label="Purpose of Visit *"
                    {...register('purpose')}
                    placeholder="e.g., Bringing food, visiting"
                    error={errors.purpose?.message}
                />
                <Input
                    label="Remarks (Optional)"
                    {...register('remarks')}
                    placeholder="Any additional notes"
                    error={errors.remarks?.message}
                />
            </div>
        </Modal>
    );
}
