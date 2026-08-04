import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { visitorApi } from '../../api/visitorApi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import TimeInput from '@/components/ui/TimeInput';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const addStudentSchema = z.object({
    expectedExitTime: z.string().min(1, 'Expected return time is required').refine((val) => {
        const now = new Date();
        const [hours, minutes] = val.split(':');
        const exitTime = new Date();
        exitTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        // Handle next day if the time entered is technically before 'now' in the current day
        if (exitTime < now) {
            exitTime.setDate(exitTime.getDate() + 1);
        }
        
        const diffInMinutes = (exitTime.getTime() - now.getTime()) / (1000 * 60);
        return diffInMinutes > 0 && diffInMinutes <= 60;
    }, "Exit time must be within 1 hour from now"),
    selectedStudentIds: z.array(z.string()).min(1, 'Select at least one student to add'),
});

const AddStudentToVisitModal = ({ isOpen, onClose, onSuccess, visit, visitId }) => {
    const [isLoadingVisitor, setIsLoadingVisitor] = useState(false);
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [alreadyVisitingStudents, setAlreadyVisitingStudents] = useState([]);

    const { handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: zodResolver(addStudentSchema),
        defaultValues: {
            selectedStudentIds: []
        }
    });

    useEffect(() => {
        if (isOpen && visit) {
            const fetchVisitorProfile = async () => {
                setIsLoadingVisitor(true);
                try {
                    const visitorId = visit.visitorInformation?.visitorId || visit.visitorId;
                    if (!visitorId) throw new Error("Visitor ID missing");
                    
                    const res = await visitorApi.getVisitorDetails(visitorId);
                    const visitorData = res.data?.data || res.data;
                    const linked = visitorData.linkedStudents || visitorData.students || [];
                    
                    // Group students based on whether they are already in the current visit
                    const currentVisitStudentIds = new Set(
                        (visit.studentInformation || []).map(s => String(s.studentId || s._id || s.id))
                    );

                    const alreadyVisiting = [];
                    const available = [];

                    linked.forEach(student => {
                        const sId = String(student.studentId || student._id || student.id);
                        if (!sId) return;

                        if (currentVisitStudentIds.has(sId)) {
                            alreadyVisiting.push(student);
                        } else {
                            available.push(student);
                        }
                    });

                    setAlreadyVisitingStudents(alreadyVisiting);
                    setAvailableStudents(available);
                } catch (error) {
                    console.error("Failed to fetch visitor profile:", error);
                    showErrorToast("Failed to load visitor's linked students");
                } finally {
                    setIsLoadingVisitor(false);
                }
            };

            fetchVisitorProfile();
        } else {
            reset({ selectedStudentIds: [], expectedExitTime: '' });
            setAvailableStudents([]);
            setAlreadyVisitingStudents([]);
        }
    }, [isOpen, visit, reset]);

    const onSubmit = async (data) => {
        setIsApiLoading(true);
        try {
            const now = new Date();
            const [hours, minutes] = data.expectedExitTime.split(':');
            const exitTime = new Date();
            exitTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            
            if (exitTime < now) {
                exitTime.setDate(exitTime.getDate() + 1);
            }

            const payload = {
                selectedStudentIds: data.selectedStudentIds,
                expectedExitTime: exitTime.toISOString()
            };

            await visitorApi.addStudentsToVisit(visitId, payload);
            showSuccessToast('Students added to visit successfully');
            
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error("Failed to add students:", error);
            showErrorToast('Failed to add students', error.response?.data?.message || error.message || 'Something went wrong');
        } finally {
            setIsApiLoading(false);
        }
    };

    if (!isOpen || !visit) return null;

    const hasAvailableStudents = availableStudents.length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Students to Visit"
            asForm
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="max-w-xl"
        >
            <div className="flex flex-col gap-4 mt-2">
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex items-center gap-2 mb-2">
                    <span className="text-sm text-primary">
                        Extending visit for <strong>{visit.visitorInformation?.visitorName || 'Visitor'}</strong> to include additional students.
                    </span>
                </div>

                {isLoadingVisitor ? (
                    <div className="text-sm text-gray-500 animate-pulse bg-gray-50 p-4 rounded-xl">Loading students...</div>
                ) : (
                    <div className="space-y-4">
                        {/* Selectable Students */}
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <label className="block mb-1 text-sm text-text-primary font-medium">Available Students *</label>
                            
                            {!hasAvailableStudents ? (
                                <div className="text-sm text-gray-500">
                                    No other students available to add to this visit.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                    <Controller
                                        name="selectedStudentIds"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                {availableStudents.map((student) => {
                                                    const sId = String(student.studentId || student._id || student.id);
                                                    
                                                    return (
                                                        <label key={sId} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer bg-white transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                                checked={field.value?.includes(sId)}
                                                                onChange={(e) => {
                                                                    const current = field.value || [];
                                                                    if (e.target.checked) {
                                                                        field.onChange([...current, sId]);
                                                                    } else {
                                                                        field.onChange(current.filter(id => id !== sId));
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
                            )}
                            {errors.selectedStudentIds && <span className="text-xs text-danger mt-1 block">{errors.selectedStudentIds.message}</span>}
                        </div>

                        {/* Already Visiting (Disabled) */}
                        {alreadyVisitingStudents.length > 0 && (
                            <div className="space-y-3 opacity-70">
                                <label className="block mb-1 text-sm text-text-primary font-medium">Already Visiting</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                    {alreadyVisitingStudents.map((student) => {
                                        const sId = String(student.studentId || student._id || student.id);
                                        return (
                                            <label key={sId} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-gray-100 cursor-not-allowed">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                    checked={true}
                                                    disabled={true}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800">{student.name}</span>
                                                    {student.roomNumber && <span className="text-xs text-gray-500">Room: {student.roomNumber}</span>}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <Controller
                        name="expectedExitTime"
                        control={control}
                        render={({ field }) => (
                            <TimeInput
                                label="New Expected Return Time *"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.expectedExitTime?.message}
                                className="py-2! text-[13px]!"
                                disabled={!hasAvailableStudents}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
                <Button type="button" variant="outline" size='md' fullWidth={false} onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" size='md' fullWidth={false} isLoading={isApiLoading} disabled={!hasAvailableStudents || isApiLoading}>
                    Add Students
                </Button>
            </div>
        </Modal>
    );
};

export default AddStudentToVisitModal;
