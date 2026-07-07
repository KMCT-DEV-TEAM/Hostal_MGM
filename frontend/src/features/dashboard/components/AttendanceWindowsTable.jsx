import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import { formatDateISO, formatTime, capitalize } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import FilterWindowsModal from './FilterWindowsModal';
import { Filter } from 'lucide-react';

export default function AttendanceWindowsTable({ showHostel = true, showWarden = true, onRowClick }) {
    const { user } = useAuthStore();
    const [windows, setWindows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [pagination, setPagination] = useState({
        totalRecords: 0,
        totalPages: 1
    });

    const fetchWindows = useCallback(async () => {
        if (!user?.role) return;

        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                // if search is supported backend side we pass it, otherwise we could do frontend filtering
                ...(searchQuery && { search: searchQuery }),
                ...filters
            };
            const response = await attendanceService.getWindowsByRole(user.role, params);

            setWindows(response?.windows || []);
            setPagination(response?.pagination || { totalRecords: 0, totalPages: 1 });
        } catch (error) {
            showErrorToast('Failed to load attendance windows', error.message);
        } finally {
            setLoading(false);
        }
    }, [user?.role, page, searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWindows();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchWindows]);

    const headers = [
        '#',
        'Date',
        ...(showHostel ? ['Hostel'] : []),
        ...(showWarden ? ['Warden'] : []),
        'Students',
        'Present',
        'Absent'
    ];

    const renderRow = (item, index) => {
        const actualIndex = (page - 1) * 10 + index + 1;
        const formattedDate = new Date(item.attendanceDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, ' - ').toLowerCase(); // To match "17 - june - 2026"

        return (
            <>
                <td className="p-4 align-middle text-gray-500">
                    {actualIndex}
                </td>
                <td className="p-4 align-middle text-gray-500">
                    {formattedDate}
                </td>
                {showHostel && (
                    <td className="p-4 align-middle text-gray-500">
                        {item.hostel?.name || 'N/A'}
                    </td>
                )}
                {showWarden && (
                    <td className="p-4 align-middle text-gray-500">
                        {item.startedBy?.name || 'N/A'}
                    </td>
                )}
                <td className="p-4 align-middle text-gray-500">
                    {item.totalStudents}
                </td>
                <td className="p-4 align-middle text-gray-500">
                    {item.presentCount}
                </td>
                <td className="p-4 align-middle text-gray-500">
                    {item.absentCount}
                </td>
            </>
        );
    };

    const renderMobileItem = (item) => {
        return (
            <div className="flex flex-col gap-2 w-full text-sm">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{formatDateISO(item.attendanceDate)}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'open' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                        {capitalize(item.status)}
                    </span>
                </div>
                {showHostel && (
                    <div className="text-gray-600">
                        <span className="font-medium">Hostel:</span> {item.hostel?.name || 'N/A'}
                    </div>
                )}
                <div className="text-gray-600">
                    <span className="font-medium">Stats:</span> <span className="text-green-600">{item.presentCount}</span> / <span className="text-red-600">{item.absentCount}</span> / {item.totalStudents}
                </div>
                {showWarden && (
                    <div className="text-gray-600">
                        <span className="font-medium">Started By:</span> {item.startedBy?.name || 'N/A'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <DataTable
                searchQuery={searchQuery}
                onSearchChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                }}
                searchPlaceholder="Search by date or hostel..."
                toolbarActions={
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2 rounded-md transition-colors ${Object.keys(filters).length > 0 ? 'bg-primary text-white hover:bg-secondary' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        title="Filter windows"
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                }
                headers={headers}
                items={windows}
                loading={loading}
                renderRow={renderRow}
                renderMobileItem={renderMobileItem}
                onRowClick={onRowClick}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
                emptyText="No attendance windows found."
            />
            <FilterWindowsModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApply={(newFilters) => {
                    const cleanedFilters = Object.fromEntries(
                        Object.entries(newFilters).filter(([_, v]) => v !== '')
                    );
                    setFilters(cleanedFilters);
                    setIsFilterModalOpen(false);
                    setPage(1);
                }}
                onReset={() => {
                    setFilters({});
                    setIsFilterModalOpen(false);
                    setPage(1);
                }}
            />
        </>
    );
}
