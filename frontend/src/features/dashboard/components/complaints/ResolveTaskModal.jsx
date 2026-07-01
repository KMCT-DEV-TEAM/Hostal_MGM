import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function ResolveTaskModal({ isOpen, onClose, complaint, onResolved }) {
    const [materialsUsed, setMaterialsUsed] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'submit' or 'discard'

    if (!isOpen) return null;

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        setConfirmAction('submit');
    };

    const handleInitialCancel = () => {
        if (materialsUsed || resolutionNotes) {
            setConfirmAction('discard');
        } else {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (confirmAction === 'discard') {
            setConfirmAction(null);
            setMaterialsUsed('');
            setResolutionNotes('');
            onClose();
            return;
        }

        // if submit
        
        setIsSubmitting(true);
        try {
            await ComplaintService.submitComplaintResolution(complaint._id, {
                materialsUsed,
                resolutionNotes
            });
            showSuccessToast('Success', 'Resolution submitted and awaiting approval.');
            onResolved();
            onClose();
        } catch (error) {
            showErrorToast('Submission Failed', error.message || 'Could not submit resolution.');
        } finally {
            setIsSubmitting(false);
            setConfirmAction(null);
        }
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            title="Resolve Complaint"
            subtitle="Submit resolution details for warden approval."
            maxWidth="max-w-md"
        >
            <form onSubmit={handleInitialSubmit} className="space-y-4">
                <Input
                    label="Glossary / Materials Used"
                    placeholder="e.g., 1 pipe, 2 screws"
                    value={materialsUsed}
                    onChange={(e) => setMaterialsUsed(e.target.value)}
                />
                
                <div>
                    <label className="block text-[13px] font-medium text-text-primary mb-1">
                        Resolution Notes <span className="text-danger">*</span>
                    </label>
                    <textarea
                        required
                        rows={4}
                        placeholder="Describe the work done to resolve the issue..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-border bg-white rounded-lg text-[13px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-shadow resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={handleInitialCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <button type="submit" disabled={isSubmitting} className="flex items-center justify-center min-w-[140px] px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Resolution'}
                    </button>
                </div>
            </form>

            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={confirmAction === 'submit' ? "Confirm Resolution" : "Discard Changes?"}
                message={confirmAction === 'submit' ? "Are you sure you want to submit this resolution?" : "You have unsaved changes. Are you sure you want to discard them?"}
                confirmText={confirmAction === 'submit' ? "Submit" : "Discard"}
                confirmButtonClass={confirmAction === 'discard' ? "bg-red-600 text-white hover:bg-red-700 min-w-[100px]" : "bg-[#0A437A] text-white hover:bg-[#083663] min-w-[100px]"}
                isSubmitting={isSubmitting}
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
            />
        </Modal>
    );
}
