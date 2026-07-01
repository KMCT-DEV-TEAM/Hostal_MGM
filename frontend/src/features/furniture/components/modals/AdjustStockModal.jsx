import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

export default function AdjustStockModal({ isOpen, onClose, onSave, furnitureName }) {
    const [count, setCount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(parseInt(count, 10));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Adjust Stock: ${furnitureName}`}
            subtitle="Add or remove assets. Use negative numbers to reduce stock."
            maxWidth="max-w-sm"
            asForm
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Adjustment <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        name="count"
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. 5 or -2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Positive number adds stock, negative removes stock.</p>
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
                    disabled={isSubmitting || !count}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
            </div>
        </Modal>
    );
}
