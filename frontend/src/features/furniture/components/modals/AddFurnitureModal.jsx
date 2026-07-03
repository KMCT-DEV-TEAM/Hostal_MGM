import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import { getHostels } from '@/services/hostel.service';

const FURNITURE_OPTIONS = [
    { label: 'Bed', value: 'Bed' },
    { label: 'Chair', value: 'Chair' },
    { label: 'Table', value: 'Table' },
    { label: 'Cupboard', value: 'Cupboard' },
    { label: 'Desk', value: 'Desk' },
    { label: 'Almirah', value: 'Almirah' },
    { label: 'Locker', value: 'Locker' },
    { label: 'Fan', value: 'Fan' },
    { label: 'Other', value: 'Other' },
];

export default function AddFurnitureModal({ isOpen, onClose, onSave, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        customName: '',
        prefix: '',
        description: '',
        openingStock: 0,
        hostelId: '',
        isActive: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hostels, setHostels] = useState([]);

    useEffect(() => {
        const fetchHostels = async () => {
            try {
                const data = await getHostels({ limit: 100 });
                setHostels(data?.data || data?.hostels || data || []);
            } catch (error) {
                console.error("Failed to fetch hostels:", error);
            }
        };
        fetchHostels();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: FURNITURE_OPTIONS.find(o => o.value === initialData.name) ? initialData.name : 'Other',
                customName: !FURNITURE_OPTIONS.find(o => o.value === initialData.name) ? initialData.name : '',
                prefix: initialData.prefix || '',
                description: initialData.description || '',
                openingStock: initialData.openingStock || 0,
                hostelId: initialData.hostel?._id || initialData.hostelId || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true
            });
        } else {
            setFormData({
                name: '',
                customName: '',
                prefix: '',
                description: '',
                openingStock: 0,
                hostelId: '',
                isActive: true
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const finalName = formData.name === 'Other' ? formData.customName : formData.name;
            const selectedHostel = hostels.find(h => h._id === formData.hostelId);
            const organizationId = selectedHostel?.organizations?.[0]?._id || selectedHostel?.organizations?.[0];

            await onSave({
                ...formData,
                name: finalName,
                organizationId,
                openingStock: parseInt(formData.openingStock, 10) || 0
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Furniture Type" : "Add Furniture Type"}
            subtitle="Fill in the details below to manage this furniture type."
            maxWidth="max-w-md"
            asForm
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Furniture <span className="text-red-500">*</span></label>
                        <Dropdown
                            options={FURNITURE_OPTIONS}
                            value={formData.name}
                            onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                            placeholder="Select"
                            triggerClassName="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none flex items-center justify-between min-h-[42px]"
                        />
                        {formData.name === 'Other' && (
                            <input
                                type="text"
                                name="customName"
                                value={formData.customName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Enter custom name"
                            />
                        )}
                    </div>

                    {!initialData ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                name="openingStock"
                                value={formData.openingStock}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px]"
                                placeholder="enter the quantity"
                            />
                        </div>
                    ) : (
                        <div></div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hostel <span className="text-red-500">*</span></label>
                    <Dropdown
                        options={hostels.map(h => ({ label: h.name, value: h._id }))}
                        value={formData.hostelId}
                        onChange={(val) => setFormData(prev => ({ ...prev, hostelId: val }))}
                        placeholder="Select"
                        triggerClassName="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none flex items-center justify-between min-h-[42px]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prefix <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="prefix"
                        value={formData.prefix}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                        placeholder="Enter"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        placeholder="Enter"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Active (available for allocation)
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <Button
                    variant="primary"
                    fullWidth={false}
                    size="md"
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.prefix || !formData.hostelId}
                    className="min-w-[120px] order-2 bg-[#0a3a6a] hover:bg-[#0a3a6a]/90 capitalize"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'save'}
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
