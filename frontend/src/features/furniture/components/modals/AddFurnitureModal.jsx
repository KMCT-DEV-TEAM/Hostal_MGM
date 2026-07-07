import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AsyncDropdown from '@/components/ui/AsyncDropdown';
import { getSelectionHostels } from '@/services/hostel.service';
import { getOrganizations } from '@/services/organization.service';
import { useAuthStore } from '@/store/useAuthStore';

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
        openingStock: '',
        hostelId: '',
        organizationId: '',
        isActive: true
    });

    const role = useAuthStore(s => s.user?.role);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hostelMap, setHostelMap] = useState({});

    const fetchHostelOptions = useCallback(async ({ page, search }) => {
        try {
            const response = await getSelectionHostels({ page, limit: 10, search });
            const data = response?.data?.hostels || response?.hostels || response?.data || [];
            const totalPages = response?.data?.pagination?.totalPages || response?.pagination?.totalPages || 1;

            const options = data.map(h => ({
                label: h.name,
                value: h._id,
                organizationId: h.organizations?.[0]?._id || h.organizations?.[0]
            }));

            setHostelMap(prev => {
                const newMap = { ...prev };
                options.forEach(opt => newMap[opt.value] = opt);
                return newMap;
            });

            return { options, hasMore: page < totalPages };
        } catch (error) {
            console.error("Failed to fetch hostels:", error);
            return { options: [], hasMore: false };
        }
    }, []);

    const fetchOrganizationOptions = useCallback(async ({ page, search }) => {
        try {
            const response = await getOrganizations({ page, limit: 10, search });
            const data = response?.data?.organizations || response?.organizations || response?.data || [];
            const totalPages = response?.data?.pagination?.totalPages || response?.pagination?.totalPages || 1;

            const options = data.map(o => ({
                label: o.name,
                value: o._id,
            }));

            return { options, hasMore: page < totalPages };
        } catch (error) {
            console.error("Failed to fetch organizations:", error);
            return { options: [], hasMore: false };
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: FURNITURE_OPTIONS.find(o => o.value === initialData.name) ? initialData.name : 'Other',
                customName: !FURNITURE_OPTIONS.find(o => o.value === initialData.name) ? initialData.name : '',
                prefix: initialData.prefix || '',
                description: initialData.description || '',
                openingStock: initialData.openingStock || '',
                hostelId: initialData.hostel?._id || initialData.hostelId || '',
                organizationId: initialData.organization?._id || initialData.organizationId || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true
            });
        } else {
            setFormData({
                name: '',
                customName: '',
                prefix: '',
                description: '',
                openingStock: '',
                hostelId: '',
                organizationId: '',
                isActive: true
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'prefix' ? value.toUpperCase() : (type === 'checkbox' ? checked : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const finalName = formData.name === 'Other' ? formData.customName : formData.name;

            let organizationId = undefined;
            if (role === 'super_admin') {
                organizationId = formData.organizationId;
            }

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
                            triggerClassName="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors flex items-center justify-between"
                        />
                        {formData.name === 'Other' && (
                            <Input
                                name="customName"
                                value={formData.customName}
                                onChange={handleChange}
                                required
                                placeholder="Enter custom name"
                                containerClassName="mt-3"
                            />
                        )}
                    </div>

                    {!initialData ? (
                        <Input
                            label="Quantity"
                            type="number"
                            name="openingStock"
                            value={formData.openingStock}
                            onChange={handleChange}
                            min="0"
                            placeholder="enter the quantity"
                        />
                    ) : (
                        <div></div>
                    )}
                </div>

                {role === 'super_admin' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                        <AsyncDropdown
                            fetchOptions={fetchOrganizationOptions}
                            value={formData.organizationId}
                            onChange={(val) => setFormData(prev => ({ ...prev, organizationId: val }))}
                            placeholder="Select Organization"
                            triggerClassName="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors flex items-center justify-between"
                            lookup={initialData && initialData.organization ? {
                                [initialData.organization._id || initialData.organizationId]: { label: initialData.organization.name }
                            } : {}}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hostel <span className="text-red-500">*</span></label>
                    <AsyncDropdown
                        fetchOptions={fetchHostelOptions}
                        value={formData.hostelId}
                        onChange={(val) => setFormData(prev => ({ ...prev, hostelId: val }))}
                        placeholder="Select Hostel"
                        triggerClassName="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors flex items-center justify-between"
                        lookup={initialData && initialData.hostel ? {
                            [initialData.hostel._id || initialData.hostelId]: { label: initialData.hostel.name }
                        } : {}}
                    />
                </div>

                <Input
                    label="Prefix"
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    placeholder="e.g. BD"
                />

                <Input
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter description"
                />

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
                    disabled={isSubmitting || !formData.name || !formData.prefix || !formData.hostelId || (role === 'super_admin' && !formData.organizationId)}
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
