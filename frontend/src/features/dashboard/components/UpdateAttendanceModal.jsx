import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { formatDateReadable } from '@/utils/formatters';

export default function UpdateAttendanceModal({ isOpen, onClose, student, date, currentStatus, windowId, onSuccess }) {
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, statusToUpdate: null });

    if (!isOpen || !student) return null;

    const formattedDate = formatDateReadable(date || new Date());

    const handleUpdateStatus = async (statusToUpdate) => {
        if (!windowId || !user?.role) {
            showErrorToast("Cannot update attendance. Missing window ID.");
            return;
        }

        try {
            setIsSubmitting(true);
            await attendanceService.correctAttendanceByRole(user.role, windowId, student.id, {
                status: statusToUpdate,
                remarks: `Marked ${statusToUpdate.replace('_', ' ')} manually by warden`
            });
            showSuccessToast('Attendance corrected successfully.');
            setConfirmModal({ isOpen: false, statusToUpdate: null });
            if (onSuccess) onSuccess();
        } catch (error) {
            showErrorToast('Failed to update attendance', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmUpdate = (status) => {
        setConfirmModal({ isOpen: true, statusToUpdate: status });
    };

    const isCurrentlyAbsent = currentStatus === 'absent';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Attendance"
            subtitle="You are updating attendance for an existing record"
            maxWidth="max-w-md"
        >
            <div className="mt-4 pt-6 border-t border-gray-100">
                {/* Profile Section */}
                <div className="flex flex-row items-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold shadow-sm">
                        {student.name?.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="ml-4 flex flex-col items-start flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base text-text-primary">{student.name}</h3>
                            <span className="text-xs text-text-secondary">{formattedDate}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">Room No : {student.room || 'N/A'}</p>
                    </div>
                </div>

                {/* Current Status */}
                <div className="flex items-center mb-6 gap-2">
                    <span className="text-sm font-medium text-gray-600">Current Status :</span>
                    <div className="flex items-center gap-1.5 ml-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus === 'present' ? 'bg-success' :
                            currentStatus === 'absent' ? 'bg-danger' :
                                currentStatus === 'on_leave' ? 'bg-warning' : 'bg-gray-300'
                            }`}></div>
                        <span className="text-sm font-semibold capitalize text-text-primary">
                            {currentStatus || 'Not Marked'}
                        </span>
                    </div>
                </div>

                {/* Action Box */}
                <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-4">
                    <h4 className="font-semibold text-text-primary">Update Status</h4>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">
                        Select a new status to update the student's attendance.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 w-full mt-2">
                        {currentStatus !== 'present' && (
                            <Button
                                onClick={() => confirmUpdate('present')}
                                disabled={isSubmitting}
                                className="bg-success! hover:bg-success/90! text-white text-xs px-3"
                                fullWidth={false}
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                Mark Present
                            </Button>
                        )}
                        {currentStatus !== 'absent' && (
                            <Button
                                onClick={() => confirmUpdate('absent')}
                                disabled={isSubmitting}
                                className="bg-danger! hover:bg-danger/90! text-white text-xs px-3"
                                fullWidth={false}
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                Mark Absent
                            </Button>
                        )}
                        {currentStatus !== 'on_leave' && (
                            <Button
                                onClick={() => confirmUpdate('on_leave')}
                                disabled={isSubmitting}
                                className="bg-warning! hover:bg-warning/90! text-white text-xs px-3"
                                fullWidth={false}
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                Mark on Leave
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] text-text-secondary">Attendance can be updated for today only</p>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, statusToUpdate: null })}
                onConfirm={() => handleUpdateStatus(confirmModal.statusToUpdate)}
                title="Confirm Update"
                message={`Are you sure you want to mark ${student.name}'s attendance as ${confirmModal.statusToUpdate?.replace('_', ' ')}?`}
                confirmText="Yes, Update"
                cancelText="Cancel"
                isSubmitting={isSubmitting}
                variant="primary"
            />
        </Modal>
    );
}
