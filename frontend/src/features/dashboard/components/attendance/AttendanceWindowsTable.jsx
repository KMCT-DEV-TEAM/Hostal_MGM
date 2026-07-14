import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import { formatDateISO, formatTime, capitalize } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import FilterWindowsModal from './FilterWindowsModal';
import { Filter } from 'lucide-react';
import InfoCard from '@/components/ui/InfoCard';
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
            <div className="mb-2">
                <InfoCard
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    title={formatDateISO(item.attendanceDate)}
                    status={{ text: capitalize(item.status), color: item.status === 'open' ? 'blue' : 'green' }}
                    fields={[
                        showHostel && { label: "Hostel", value: item.hostel?.name || 'N/A' },
                        showWarden && { label: "Started By", value: item.startedBy?.name || 'N/A' }
                    ].filter(Boolean)}
                    stats={[
                        { label: "Total", value: item.totalStudents },
                        { label: "Present", value: <span className="text-green-600">{item.presentCount}</span> },
                        { label: "Absent", value: <span className="text-red-600">{item.absentCount}</span> }
                    ]}
                />
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
                toolbarActions={
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2.5 rounded-xl transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 ${Object.keys(filters).length > 0 ? 'bg-[#0A437A] text-white hover:bg-[#0A437A]/90' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 h-10 w-10'}`}
                        title="Filter windows"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                }
            />
            <FilterWindowsModal
                isOpen={isFilterModalOpen}
                showHostel={showHostel}
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
