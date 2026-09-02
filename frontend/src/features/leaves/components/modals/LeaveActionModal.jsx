import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

export default function LeaveActionModal({ isOpen, onClose, actionType, onSubmit, isSubmitting }) {
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRemarks('');
            setError('');
        }
    }, [isOpen]);

    const isApprove = actionType === 'approved';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isApprove && !remarks.trim()) {
            setError('Reason is required for rejection.');
            return;
        }
        setError('');
        onSubmit(remarks);
    };



    const titleColor = isApprove ? 'text-success' : 'text-danger';
    const titleText = isApprove ? 'Approve Request' : 'Reject Request';
    const actionVerb = isApprove ? 'approve' : 'reject';

    const btnBg = isApprove
        ? 'bg-success/80 hover:bg-success/90'
        : 'bg-danger/80 hover:bg-danger/90';

    const btnBorder = isApprove
        ? 'border border-success text-success hover:bg-success/5'
        : 'border border-danger text-danger hover:bg-danger/5';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
            asForm
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div className="text-center">
                    <h2 className={`text-xl font-bold mb-4 ${titleColor} -mt-10`}>
                        {titleText}
                    </h2>

                    <div className="w-full h-px bg-gray-200 mb-6"></div>

                    <p className="text-sm text-gray-700 font-medium">
                        Are you sure you want to {actionVerb} this leave request?
                    </p>
                </div>

                <div className="pt-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Reason
                    </label>

                    <textarea
                        value={remarks}
                        onChange={(e) => {
                            setRemarks(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder={isApprove ? "Enter the reason (optional)" : "Enter the reason (required)"}
                        className={`w-full px-4 py-3 bg-white border ${error ? 'border-danger' : 'border-gray-300'} rounded-md text-sm focus:outline-none min-h-[100px] resize-y`}
                    />
                    {error && <p className="text-danger text-xs mt-1 font-medium">{error}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        className={`px-6 py-2.5 text-sm font-semibold text-white rounded-md transition-colors min-w-[100px] ${btnBg}`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Processing...
                            </span>
                        ) : (
                            isApprove ? 'Approve' : 'Reject'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-md bg-white transition-colors min-w-[100px] ${btnBorder}`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
