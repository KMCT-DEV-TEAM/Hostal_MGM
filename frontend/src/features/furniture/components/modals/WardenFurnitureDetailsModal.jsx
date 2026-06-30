import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
import { showErrorToast } from '@/utils/toast';

export default function WardenFurnitureDetailsModal({ isOpen, onClose, furnitureType }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        if (isOpen && furnitureType) {
            fetchAssets();
        }
    }, [isOpen, furnitureType, page]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const res = await furnitureApi.getFurnitureTypeDetails(furnitureType._id, {
                page,
                limit
            });
            setAssets(res.assets?.data || res.assets || []);
            setTotalPages(res.assets?.totalPages || res.pagination?.totalPages || 1);
        } catch (error) {
            showErrorToast(error.message || 'Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    };

    const tableHeaders = [
        { key: 'code', label: 'Asset Code' },
        { key: 'status', label: 'Status' },
        { key: 'allocatedTo', label: 'Allocated To' }
    ];

    const getStatusStyle = (status) => {
        if (status === 'Available') return 'text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20';
        if (status === 'Allocated') return 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20';
        if (status === 'Maintenance') return 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20';
        if (status === 'Lost') return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20';
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${furnitureType?.name || 'Furniture'} Assets`}
            subtitle="View all individual items."
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <DataTable
                        headers={tableHeaders}
                        items={assets}
                        canSelect={false}
                        emptyText="No assets found."
                        isLoading={loading}
                        renderRow={(item) => (
                            <>
                                <td className="p-4 text-sm text-gray-900 font-medium">
                                    {item.furnitureId}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {item.studentId ? (
                                        <span>{item.studentId.name} ({item.studentId.admissionNo})</span>
                                    ) : (
                                        <span className="text-gray-400">Not assigned</span>
                                    )}
                                </td>
                            </>
                        )}
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
                
                <div className="flex justify-end pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
