import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function RejectAssignedTaskModal({ isOpen, onClose, complaint, onRejected }) {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'submit' or 'discard'

    if (!isOpen || !complaint) return null;

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        
        if (!note.trim()) {
            showErrorToast('Error', 'Please provide a reason for rejecting the task');
            return;
        }

        setConfirmAction('submit');
    };

    const handleInitialCancel = () => {
        if (note.trim()) {
            setConfirmAction('discard');
        } else {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (confirmAction === 'discard') {
            setConfirmAction(null);
            setNote('');
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            await ComplaintService.rejectAssignedTask(complaint._id, note);
            showSuccessToast('Success', 'Task rejected successfully');
            onRejected();
            setNote('');
            onClose();
        } catch (error) {
            showErrorToast('Error', error.response?.data?.message || 'Failed to reject task');
        } finally {
            setIsSubmitting(false);
            setConfirmAction(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Reject Task</h2>
                        <p className="text-sm text-gray-500 mt-1">Room {complaint.roomNo} - {complaint.subject}</p>
                    </div>
                    <button 
                        onClick={handleInitialCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 bg-red-50/50 border-b border-red-100">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-red-800">Rejecting this task</h3>
                            <p className="text-sm text-red-600 mt-1">
                                This will return the task to the admin as Pending and unassign you. Please provide a detailed reason.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleInitialSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Rejection <span className="text-danger">*</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder-gray-400"
                            placeholder="Why are you rejecting this task? (e.g. incorrect category, missing tools, need more info...)"
                            required
                        />
                    </div>
                </form>

                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleInitialCancel}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInitialSubmit}
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject Task'}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={confirmAction === 'submit' ? "Confirm Rejection" : "Discard Changes?"}
                message={confirmAction === 'submit' ? "Are you sure you want to reject this task? It will be sent back to the admin." : "You have unsaved changes. Are you sure you want to discard them?"}
                confirmText={confirmAction === 'submit' ? "Reject Task" : "Discard"}
                confirmButtonClass={confirmAction === 'submit' || confirmAction === 'discard' ? "bg-red-600 text-white hover:bg-red-700 min-w-[100px]" : "bg-[#0A437A] text-white hover:bg-[#083663] min-w-[100px]"}
                isSubmitting={isSubmitting}
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
            />
        </div>
    );
}
