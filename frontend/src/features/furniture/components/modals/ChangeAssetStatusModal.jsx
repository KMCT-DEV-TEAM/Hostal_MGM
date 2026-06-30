import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

export default function ChangeAssetStatusModal({ isOpen, onClose, onSave, asset }) {
    const [status, setStatus] = useState(asset?.status || 'Available');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(asset._id, status);
        } finally {
            setIsSubmitting(false);
        }
    };

    const statuses = ["Available", "Maintenance", "Lost", "Scrap"];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Update Status: ${asset?.furnitureId || ''}`}
            subtitle="Change the status of this specific asset."
            maxWidth="max-w-sm"
            asForm
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={asset?.status === 'Allocated'} // Cannot manually change if allocated to a student
                    >
                        {asset?.status === 'Allocated' && <option value="Allocated">Allocated</option>}
                        {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    {asset?.status === 'Allocated' && (
                        <p className="text-xs text-amber-600 mt-1">This asset is allocated to a student. Status cannot be changed manually until unallocated.</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || asset?.status === 'Allocated' || status === asset?.status}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Status'}
                </button>
            </div>
        </Modal>
    );
}
