import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

export default function LeaveActionModal({ isOpen, onClose, actionType, onSubmit, isSubmitting }) {
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRemarks('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(remarks);
    };

    const isApprove = actionType === 'approved';
    const isReject = actionType === 'rejected';

    const titleColor = isApprove ? 'text-success' : 'text-danger';
    const titleText = isApprove ? 'Approve Request' : 'Reject Request';
    const actionVerb = isApprove ? 'approve' : 'reject';

    // Button colors
    const btnBg = isApprove ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90';
    const btnBorder = isApprove ? 'border border-success text-success hover:bg-success/5' : 'border border-danger text-danger hover:bg-danger/5';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
            asForm
            onSubmit={handleSubmit}
        // Omitting title and subtitle to use custom header layout
        >
            <div className="space-y-4">
                <div className="text-center">
                    <h2 className={`text-xl font-bold mb-4 ${titleColor}`}>
                        {titleText}
                    </h2>
                    <div className="w-full h-px bg-gray-200 mb-6"></div>
                    <p className="text-sm text-gray-700 font-medium">
                        Are you sure you want to {actionVerb} this leave request?
                    </p>
                </div>

                <div className="pt-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        required
                        placeholder="Enter the reason"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none min-h-[100px] resize-y"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || !remarks.trim()}
                        className={`px-6 py-2.5 text-sm font-semibold text-white rounded-md transition-colors min-w-[100px] ${btnBg} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? '...' : (isApprove ? 'Approve' : 'Reject')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-md bg-white transition-colors min-w-[100px] ${btnBorder}`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
