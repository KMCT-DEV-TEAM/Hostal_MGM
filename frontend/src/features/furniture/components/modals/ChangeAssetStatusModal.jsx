import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';

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
                    {asset?.status === 'Allocated' ? (
                        <Dropdown
                            options={[{ label: 'Allocated', value: 'Allocated' }]}
                            value="Allocated"
                            onChange={() => {}}
                            disabled={true}
                            triggerClassName="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-lg text-sm focus:outline-none flex items-center justify-between opacity-75 cursor-not-allowed"
                        />
                    ) : (
                        <Dropdown
                            options={statuses.map(s => ({ label: s, value: s }))}
                            value={status}
                            onChange={(val) => setStatus(val)}
                            triggerClassName="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors flex items-center justify-between"
                        />
                    )}
                    {asset?.status === 'Allocated' && (
                        <p className="text-xs text-amber-600 mt-1">This asset is allocated to a student. Status cannot be changed manually until unallocated.</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <Button
                    variant="primary"
                    fullWidth={false}
                    size="md"
                    type="submit"
                    disabled={isSubmitting || asset?.status === 'Allocated' || status === asset?.status}
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
                    className="min-w-[120px] order-1 text-[#0a3a6a] border-[#0a3a6a] hover:bg-gray-50"
                >
                    Cancel
                </Button>
            </div>
        </Modal>
    );
}
