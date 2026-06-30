import React, { useState, useEffect } from 'react';
import { Download, Box, PackageCheck, PackageOpen } from 'lucide-react';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { showErrorToast } from '@/utils/toast';
import WardenFurnitureDetailsModal from '../components/modals/WardenFurnitureDetailsModal';

export default function WardenFurniture() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const limit = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchFurnitureTypes();
    }, [page, debouncedSearch, statusFilter]);

    const fetchFurnitureTypes = async () => {
        try {
            setLoading(true);
            const res = await furnitureApi.getFurnitureTypes({
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter
            });
            setTypes(res.data?.data || res.data || []);
            setPagination({
                totalPages: res.data?.totalPages || res.totalPages || 1,
                totalRecords: res.data?.totalCount || res.totalCount || 0
            });
        } catch (error) {
            showErrorToast(error.message || 'Failed to fetch furniture types');
        } finally {
            setLoading(false);
        }
    };

    const pageTitle = 'Furniture';
    const pageSubtitle = 'View all furnitures';

    const tableHeaders = [
        { key: 'name', label: 'Furniture' },
        { key: 'total', label: 'Quantity' },
        { key: 'allocated', label: 'Assigned' },
        { key: 'available', label: 'Available' }
    ];

    const handleRowClick = (item) => {
        setSelectedType(item);
        setIsDetailsModalOpen(true);
    };

    // Calculate stats from current page for mockup representation
    const totalFurnitures = types.reduce((acc, t) => acc + (t.total || t.assets?.total || 0), 0);
    const assignedFurnitures = types.reduce((acc, t) => acc + (t.allocated || t.assets?.allocated || 0), 0);
    const availableFurnitures = types.reduce((acc, t) => acc + (t.available || t.assets?.available || 0), 0);

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            {/* Header */}
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TOTAL FURNITURES</p>
                        <p className="text-2xl font-bold text-gray-900">{totalFurnitures}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Box className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ASSIGNED FURNITURES</p>
                        <p className="text-2xl font-bold text-gray-900">{assignedFurnitures}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)] flex items-center justify-center">
                        <PackageCheck className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AVAILABLE FURNITURES</p>
                        <p className="text-2xl font-bold text-gray-900">{availableFurnitures}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center">
                        <PackageOpen className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <DataTable
                toolbarActions={
                    <>
                        <select 
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Available">Available</option>
                        </select>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </>
                }
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search furniture types..."
                headers={tableHeaders}
                items={types}
                canSelect={false}
                onRowClick={handleRowClick}
                emptyText="No furniture types found."
                isLoading={loading}
                renderRow={(item) => (
                    <>
                        <td className="p-4 text-sm text-gray-500 font-medium">
                            {item.name}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                            {item.total || item.assets?.total || 0}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                            {item.allocated || item.assets?.allocated || 0}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                            {item.available || item.assets?.available || 0}
                        </td>
                    </>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
            />

            {isDetailsModalOpen && selectedType && (
                <WardenFurnitureDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedType(null);
                    }}
                    furnitureType={selectedType}
                />
            )}
        </div>
    );
}
