import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function ResolveTaskModal({ isOpen, onClose, complaint, onResolved }) {
    const [materialsUsed, setMaterialsUsed] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
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
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Resolve Complaint"
            subtitle="Submit resolution details for warden approval."
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Resolution'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
