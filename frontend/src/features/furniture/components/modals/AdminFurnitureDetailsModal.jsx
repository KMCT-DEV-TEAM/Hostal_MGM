import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Bed, Box, PackageCheck, PackageOpen, Edit2, Check, X, Loader2 } from 'lucide-react';
import { formatDateISO } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

export default function AdminFurnitureDetailsModal({ isOpen, onClose, item, onViewList, onUpdateSuccess }) {
    const role = useAuthStore((s) => s.user?.role);
    const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Furniture Details"
            subtitle="view the details of furniture"
            maxWidth="max-w-5xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">
                {/* Left Card: Furniture Information */}
                <div className="space-y-6">
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm relative">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-primary font-semibold text-sm mb-1">Furniture Information</h3>
                                <p className="text-xs text-gray-400 mb-6">Basic Details about the Furniture</p>
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

                        <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm">
                            <div className="text-gray-500">Furniture Id</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{item.prefix || item._id.substring(0, 6).toUpperCase()}</span>
                            </div>

                            <div className="text-gray-500">Furniture</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{item.name}</span>
                            </div>

                            <div className="text-gray-500">Added on</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{formatDateISO(item.createdAt)}</span>
                            </div>

                            <div className="text-gray-500 self-center">Quantity</div>
                            <div className="flex items-center gap-3 group relative">
                                <span className="text-gray-400">:</span>
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
                                                className="p-1.5 text-success hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 shrink-0"
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
                                            {isAdmin && (
                                                <button
                                                    className="text-gray-400 hover:text-primary rounded-md transition-colors p-1.5 ml-2"
                                                    onClick={handleEditQuantityClick}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-gray-500">Assigned</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{item.allocated || item.assets?.allocated || 0}</span>
                            </div>

                            <div className="text-gray-500">Available</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{item.available || item.assets?.available || 0}</span>
                            </div>

                            <div className="text-gray-500">Prefix</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{item.prefix || '--'}</span>
                            </div>

                            <div className="text-gray-500">Description</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">{item.description || '--'}</span>
                            </div>

                            <div className="text-gray-500">Hostel / Organization</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                <span className="font-medium text-gray-900">
                                    {item.hostel?.name || item.organization?.name || '--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Card: Quick Summary */}
                <div className="space-y-6">
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Quick Summary</h3>
                        <p className="text-xs text-gray-400 mb-6">Quick summary of the furniture</p>

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
            </div>
        </Modal>
    );
}
