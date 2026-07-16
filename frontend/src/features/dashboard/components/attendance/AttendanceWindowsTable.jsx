import React, { useState, useEffect, useCallback } from 'react';
import DataView from '@/components/ui/data-view/DataView';
import { formatDateISO, capitalize } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import FilterWindowsModal from './FilterWindowsModal';
import { Filter, Building, Users } from 'lucide-react';

export default function AttendanceWindowsTable({ showHostel = true, showWarden = true, onRowClick }) {
    const { user } = useAuthStore();
    const [windows, setWindows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
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
                limit,
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
    }, [user?.role, page, limit, searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWindows();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchWindows]);

    const columns = [
        {
            key: "sno",
            header: "#",
            accessor: (_, index) => (page - 1) * limit + index + 1,
            align: "center",
        },
        {
            key: "date",
            header: "Date",
            accessor: (item) => new Date(item.attendanceDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, ' - ').toLowerCase(),
        },
        ...(showHostel ? [{
            key: "hostel",
            header: "Hostel",
            icon: Building,
            accessor: (item) => item.hostel?.name || 'N/A',
        }] : []),
        ...(showWarden ? [{
            key: "warden",
            header: "Warden",
            icon: Users,
            accessor: (item) => item.startedBy?.name || 'N/A',
        }] : []),
        {
            key: "students",
            header: "Students",
            accessor: (item) => item.totalStudents,
            align: "center",
        },
        {
            key: "present",
            header: "Present",
            accessor: (item) => item.presentCount,
            align: "center",
        },
        {
            key: "absent",
            header: "Absent",
            accessor: (item) => item.absentCount,
            align: "center",
        },
    ];

    const cardConfig = {
        title: (item) => formatDateISO(item.attendanceDate),
        status: (item) => ({
            text: capitalize(item.status),
            color: item.status === 'open' ? 'blue' : 'green'
        }),
        fields: columns.filter(c => c.key === "hostel" || c.key === "warden"),
        stats: (item) => [
            { label: "Total", value: item.totalStudents },
            { label: "Present", value: <span className="text-green-600">{item.presentCount}</span> },
            { label: "Absent", value: <span className="text-red-600">{item.absentCount}</span> }
        ]
    };

    const toolbarEndSlot = (
        <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`p-2 rounded-lg transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 ${Object.keys(filters).length > 0 ? 'bg-[#0A437A] text-white hover:bg-[#0A437A]/90' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            title="Filter windows"
        >
            <Filter className="w-4 h-4" />
        </button>
    );

    return (
        <>
            <DataView
                pageScrollMode={true}
                data={windows}
                columns={columns}
                cardConfig={cardConfig}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                }}
                searchPlaceholder="Search by date or hostel..."
                onRowClick={onRowClick}
                toolbarEndSlot={toolbarEndSlot}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
                emptyText="No attendance windows found."
                className="h-full border-none shadow-none"
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
