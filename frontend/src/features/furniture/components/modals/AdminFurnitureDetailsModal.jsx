import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Bed, Box, PackageCheck, PackageOpen, Edit2, Minus, Plus } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import AdjustStockModal from './AdjustStockModal';
import Button from '@/components/ui/Button';

export default function AdminFurnitureDetailsModal({ isOpen, onClose, item, onViewList, onUpdateSuccess }) {
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

    if (!item) return null;

    const handleAdjustStock = (count) => {
        // We will call the parent's onUpdateSuccess after the API call in AdjustStockModal, 
        // wait, AdjustStockModal takes onSave, which expects us to do the API call.
        // I will let the parent handle the API call by propagating it if needed,
        // or actually, the parent (AdminFurniture.jsx) already has AdjustStockModal! 
        // But the user wants it inside the details modal. 
        // We can just open the AdjustStockModal over this modal, and call the parent's handleAdjustStock.
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
                            <div className="flex items-center relative">
                                <span className="w-1/3 text-gray-500">Quantity</span>
                                <span className="w-8 text-gray-400">:</span>
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="inline-flex items-center border border-gray-200 rounded-full px-3 py-1 gap-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            fullWidth={false}
                                            onClick={() => setIsAdjustModalOpen(true)}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="font-semibold text-gray-900 text-xs">{item.total || item.assets?.total || 0}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            fullWidth={false}
                                            onClick={() => setIsAdjustModalOpen(true)}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        fullWidth={false}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 !p-1.5"
                                        onClick={() => setIsAdjustModalOpen(true)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
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

            {/* Adjust Stock Modal Layer */}
            {isAdjustModalOpen && (
                <AdjustStockModal
                    isOpen={isAdjustModalOpen}
                    onClose={() => setIsAdjustModalOpen(false)}
                    onSave={async (count) => {
                        await onUpdateSuccess(item._id, count);
                        setIsAdjustModalOpen(false);
                    }}
                    furnitureName={item.name}
                />
            )}
        </>
    );
}
