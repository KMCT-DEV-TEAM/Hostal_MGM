import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime } from '@/utils/formatters';
import furnitureApi from '@/features/furniture/api/furnitureApi';

const getStatusColor = (status) => {
    switch (status) {
        case 'Available':
            return 'var(--color-success)';
        case 'Allocated':
            return 'var(--color-primary)';
        case 'Maintenance':
            return 'var(--color-warning)';
        case 'Lost':
        case 'Scrap':
            return 'var(--color-danger)';
        default:
            return 'var(--color-gray-500)';
    }
};

export default function AssetDetailsModal({ isOpen, onClose, assetId, organizationName, hostelName }) {
    const [assetData, setAssetData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssetDetails = async () => {
            if (!isOpen || !assetId) {
                setAssetData(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const res = await furnitureApi.getFurnitureAssetDetails(assetId);
                setAssetData(res.data || res);
            } catch (err) {
                console.error("Failed to fetch asset details:", err);
                setError("Failed to load details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssetDetails();
    }, [isOpen, assetId]);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Loading Details..." maxWidth="max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">
                    <div className="space-y-6">
                        <div className="h-[250px] bg-gray-100 animate-pulse rounded-xl"></div>
                        <div className="h-[200px] bg-gray-100 animate-pulse rounded-xl"></div>
                        <div className="h-[300px] bg-gray-100 animate-pulse rounded-xl"></div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
                    </div>
                </div>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Error" maxWidth="max-w-md">
                <div className="p-4 text-center text-red-500 font-medium">{error}</div>
            </Modal>
        );
    }

    if (!assetData) return null;

    const timeline = assetData.timeline || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Furniture Details"
            subtitle="View the details of furniture"
            maxWidth="max-w-5xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4 relative">
                
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Furniture Information */}
                    <div className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Furniture Information</h3>
                        <p className="text-xs text-gray-400 mb-6">Basic Details about the Furniture</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Furniture Id</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {assetData.furnitureId}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Furniture</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {assetData.furnitureName}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Organization</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {organizationName || '--'}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Added on</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {formatDate(assetData.createdAt)}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Status</span>
                                <div className="flex items-center gap-2">
                                    <span>: &nbsp;</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(assetData.status) }} />
                                        <span className="text-sm font-medium text-gray-900">{assetData.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Assignment */}
                    <div className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Current Assignment</h3>
                        <p className="text-xs text-gray-400 mb-6">Basic Details about the Current Assignment</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Student</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {assetData.currentAssignment?.studentName || '--'}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Organization</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {organizationName || '--'}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500">Assigned Date</span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {assetData.currentAssignment?.assignedDate ? formatDate(assetData.currentAssignment.assignedDate) : '--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Furniture Time Line</h3>
                        <p className="text-xs text-gray-400 mb-6 border-b border-gray-100 pb-4">Timeline of the furniture</p>

                        <div className="space-y-6 pt-2">
                            {timeline.length > 0 ? (
                                timeline.map((t, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(t.currentStatus || t.action) }} />
                                        {idx !== timeline.length - 1 && (
                                            <div className="absolute left-[8px] top-4 w-[1px] h-full bg-gray-100" />
                                        )}
                                        
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-primary mb-2 inline-block">
                                                    {t.action}
                                                </span>
                                                <p className="text-xs font-medium text-gray-700 capitalize">
                                                    {t.remarks || `Furniture ${t.currentStatus?.toLowerCase() || t.action?.toLowerCase()}`}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap ml-4">
                                                {formatDateTime(t.createdAt)}
                                            </span>
                                        </div>
                                        {t.performedBy?.name && (
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[8px] font-bold">
                                                    {t.performedBy.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-[10px] text-gray-500 capitalize">{t.performedBy.name} - {t.performedBy.role?.replace('_', ' ')}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-xs text-gray-400 py-4">
                                    No timeline recorded yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6 sticky top-0 self-start">
                    {/* Quick Summary */}
                    <div className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Quick Summery</h3>
                        <p className="text-xs text-gray-400 mb-6 border-b border-gray-100 pb-4">Quick summery of the furniture</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                                    Furniture
                                </span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {assetData.furnitureName}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    Student
                                </span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {assetData.currentAssignment?.studentName || '--'}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    Status
                                </span>
                                <div className="flex items-center gap-2">
                                    <span>: &nbsp;</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(assetData.status) }} />
                                        <span className="text-sm font-medium text-gray-900">{assetData.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                                <span className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                    Hostel
                                </span>
                                <span className="text-sm font-medium text-gray-900">: &nbsp; {hostelName || '--'}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
    );
}
