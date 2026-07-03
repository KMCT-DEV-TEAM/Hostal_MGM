import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Bed, Box, PackageCheck, PackageOpen, Edit2, Check, X, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import Button from '@/components/ui/Button';

export default function AdminFurnitureDetailsModal({ isOpen, onClose, item, onViewList, onUpdateSuccess }) {
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [quantityValue, setQuantityValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!item) return null;

    const handleEditQuantityClick = () => {
        const currentTotal = item.total || item.assets?.total || 0;
        setQuantityValue(currentTotal.toString());
        setIsEditingQuantity(true);
    };

    const handleSaveQuantity = async () => {
        const currentTotal = item.total || item.assets?.total || 0;
        const newTotal = parseInt(quantityValue, 10);
        if (isNaN(newTotal)) return;

        const difference = newTotal - currentTotal;
        if (difference === 0) {
            setIsEditingQuantity(false);
            return;
        }

        setIsSaving(true);
        try {
            await onUpdateSuccess(item._id, newTotal);
            setIsEditingQuantity(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Furniture Details"
                subtitle="view the details of furniture"
                maxWidth="max-w-4xl"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Card: Furniture Information */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h3 className="text-primary font-semibold text-lg">Furniture Information</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Basic Details about the Furniture</p>
                            </div>
                            <Button
                                variant="primary"
                                fullWidth={false}
                                size="sm"
                                onClick={() => onViewList(item)}
                            >
                                View Furniture List
                            </Button>
                        </div>

                        <div className="space-y-5 text-sm">
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Furniture Id</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{item.prefix || item._id.substring(0, 6).toUpperCase()}</span>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Furniture</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{item.name}</span>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Added on</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{formatDate(item.createdAt)}</span>
                            </div>
                            <div className="flex items-center relative group">
                                <span className="w-1/3 text-gray-500">Quantity</span>
                                <span className="w-8 text-gray-400">:</span>
                                <div className="flex-1 flex items-center gap-4">
                                    {isEditingQuantity ? (
                                        <div className="flex items-center gap-2 w-full max-w-[150px]">
                                            <input
                                                type="number"
                                                value={quantityValue}
                                                onChange={(e) => setQuantityValue(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50"
                                                autoFocus
                                                disabled={isSaving}
                                            />
                                            <button
                                                onClick={handleSaveQuantity}
                                                disabled={isSaving}
                                                className="p-1.5 text-success hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 hrink-0"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingQuantity(false)}
                                                disabled={isSaving}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium text-gray-900">{item.total || item.assets?.total || 0}</span>
                                            <button
                                                className="text-gray-400 hover:text-primary rounded-md opacity-0 group-hover:opacity-100 transition-opacity p-1.5 ml-2"
                                                onClick={handleEditQuantityClick}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Assigned</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{item.allocated || item.assets?.allocated || 0}</span>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Available</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{item.available || item.assets?.available || 0}</span>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Prefix</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{item.prefix || '--'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Description</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">{item.description || '--'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-1/3 text-gray-500">Hostel / Organization</span>
                                <span className="w-8 text-gray-400">:</span>
                                <span className="flex-1 font-medium text-gray-900">
                                    {item.hostel?.name || item.organization?.name || '--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Quick Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="mb-6">
                            <h3 className="text-primary font-semibold text-lg">Quick Summary</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Quick summary of the furniture</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 space-y-5 text-sm">
                            <div className="flex items-center">
                                <span className="w-10 text-gray-400"><Bed className="w-4 h-4" /></span>
                                <span className="w-24 text-gray-500">Furniture</span>
                                <span className="w-6 text-gray-400">:</span>
                                <span className="font-semibold text-gray-900">{item.name}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-10 text-gray-400"><Box className="w-4 h-4" /></span>
                                <span className="w-24 text-gray-500">Quantity</span>
                                <span className="w-6 text-gray-400">:</span>
                                <span className="font-semibold text-gray-900">{item.total || item.assets?.total || 0}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-10 text-gray-400"><PackageCheck className="w-4 h-4" /></span>
                                <span className="w-24 text-gray-500">Assigned</span>
                                <span className="w-6 text-gray-400">:</span>
                                <span className="font-semibold text-gray-900">{item.allocated || item.assets?.allocated || 0}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-10 text-gray-400"><PackageOpen className="w-4 h-4" /></span>
                                <span className="w-24 text-gray-500">Available</span>
                                <span className="w-6 text-gray-400">:</span>
                                <span className="font-semibold text-gray-900">{item.available || item.assets?.available || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
