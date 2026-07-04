import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function ChangeAssetStatusModal({ isOpen, onClose, onSave, asset }) {
    const [status, setStatus] = useState(asset?.status || 'available');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onSave(asset._id, { status, remarks });
            setIsConfirmOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const statuses = ["available", "inactive", "maintenance", "lost", "scrap"];

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
                    {asset?.status === 'allocated' ? (
                        <Dropdown
                            options={[{ label: 'Allocated', value: 'allocated' }]}
                            value="allocated"
                            onChange={() => { }}
                            disabled={true}
                            triggerClassName="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-lg text-sm focus:outline-none flex items-center justify-between opacity-75 cursor-not-allowed"
                        />
                    ) : (
                        <Dropdown
                            options={statuses.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
                            value={status}
                            onChange={(val) => setStatus(val)}
                            triggerClassName="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors flex items-center justify-between"
                        />
                    )}
                    {asset?.status === 'allocated' && (
                        <p className="text-xs text-amber-600 mt-1">This asset is allocated to a student. Status cannot be changed manually until unallocated.</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
                    <textarea
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        rows="3"
                        placeholder="Enter reason for status change"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        required
                    ></textarea>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <Button
                    variant="primary"
                    fullWidth={false}
                    size="md"
                    type="submit"
                    disabled={isSubmitting || asset?.status === 'allocated' || (status === asset?.status && !remarks)}
                    className="min-w-[120px] order-2 bg-[#0a3a6a] hover:bg-[#0a3a6a]/90 capitalize"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'update status'}
                </Button>
                <Button
                    variant="outline"
                    fullWidth={false}
                    size="md"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => !isSubmitting && setIsConfirmOpen(false)}
                onConfirm={handleConfirm}
                isSubmitting={isSubmitting}
                title="Confirm Status Change"
                message={`Are you sure you want to change the status of ${asset?.furnitureId || 'this asset'} to "${status}"?`}
                confirmText="Update Status"
            />
        </Modal>
    );
}
