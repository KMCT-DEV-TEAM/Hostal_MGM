import React, { useState, useEffect, useCallback } from 'react';
import DataView from '@/components/ui/data-view/DataView';
import { formatDateISO, formatDateReadable } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import StudentAttendanceModal from '../StudentAttendanceModal';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterRecordsModal from './FilterRecordsModal';
import { DoorOpen, Filter, Users, Calendar } from 'lucide-react';

export default function AttendanceRecordsTable({ windowId }) {
    const { user } = useAuthStore();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [pagination, setPagination] = useState({
        totalRecords: 0,
        totalPages: 1
    });

    const fetchRecords = useCallback(async () => {
        if (!user?.role || !windowId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const params = {
                page,
                limit,
                ...(searchQuery && { search: searchQuery }),
                ...filters
            };
            const response = await attendanceService.getRecordsByRole(user.role, windowId, params);
            setRecords(response?.records || []);
            setPagination(response?.pagination || { totalRecords: 0, totalPages: 1 });
        } catch (error) {
            showErrorToast('Failed to load attendance records', error.message);
        } finally {
            setLoading(false);
        }
    }, [windowId, user?.role, page, limit, searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRecords();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchRecords]);

    const columns = [
        {
            key: "day",
            header: "Day",
            accessor: (item) => new Date(item.scannedAt).toLocaleDateString('en-US', { weekday: 'long' }),
        },
        {
            key: "date",
            header: "Date",
            accessor: (item) => formatDateISO(item.scannedAt),
        },
        {
            key: "student",
            header: "Student",
            renderCell: (item) => (
                <div className="flex items-center gap-3">
                    {item.student?.profileImage ? (
                        <img src={item.student.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-xs font-medium uppercase shrink-0">
                            {item.student?.name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                    )}
                    <span className="font-medium text-gray-700 truncate max-w-[200px]" title={item.student?.name || 'Unknown'}>
                        {item.student?.name || 'Unknown'}
                    </span>
                </div>
            )
        },
        {
            key: "room",
            header: "Room No",
            accessor: (item) => item.student?.room || 'N/A',
        },
        {
            key: "status",
            header: "Status",
            renderCell: (item) => <StatusBadge status={item.status || 'pending'} className="w-[130px]" />
        }
    ];

    const cardConfig = {
        avatar: (item) => item.student?.profileImage ? (
            <img src={item.student.profileImage} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (item.student?.name?.substring(0, 2).toUpperCase() || 'ST'),
        title: (item) => item.student?.name || 'Unknown',
        status: (item) => ({
            text: item.status || 'pending',
            color: item.status === 'present' ? 'green' : item.status === 'absent' ? 'red' : item.status === 'on_leave' ? 'orange' : 'default'
        }),
        fields: [
            { icon: Users, accessor: (item) => item.student?.name || 'Unknown' },
            { icon: Calendar, accessor: (item) => formatDateReadable(item.scannedAt) },
            { icon: DoorOpen, accessor: (item) => item.student?.room || 'N/A' }
        ]
    };

    if (!windowId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-100 p-8">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium text-gray-700 mb-1">No Active Attendance</p>
                    <p className="text-sm">Please mark today's attendance to see student records.</p>
                </div>
            </div>
        );
    }

    const addButton = (
        <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`p-2 rounded-lg transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 ${Object.keys(filters).length > 0 ? 'bg-[#0A437A] text-white hover:bg-[#0A437A]/90' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            title="Filter records"
        >
            <Filter className="w-4 h-4" />
        </button>
    );

    return (
        <>
            <DataView
                pageScrollMode={true}
                data={records}
                columns={columns}
                cardConfig={cardConfig}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                }}
                searchPlaceholder="Search student..."
                onRowClick={(item) => {
                    if (item.student) {
                        setSelectedStudent(item.student);
                        setIsModalOpen(true);
                    }
                }}
                addButton={addButton}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
                emptyText="No records found matching your search criteria."
                className="h-full border-none shadow-none"
            />

            {isFilterModalOpen && (
                <FilterRecordsModal
                    initialFilters={filters}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(newFilters) => {
                        const cleanedFilters = Object.fromEntries(
                            Object.entries(newFilters).filter(([_, v]) => v !== '')
                        );
                        setFilters(cleanedFilters);
                        setIsFilterModalOpen(false);
                        setPage(1);
                    }}
                    onFilterChange={(newFilters) => {
                        const cleanedFilters = Object.fromEntries(
                            Object.entries(newFilters).filter(([_, v]) => v !== '')
                        );
                        setFilters(cleanedFilters);
                        setPage(1);
                    }}
                />
            )}

            <StudentAttendanceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTimeout(() => setSelectedStudent(null), 200); // Clear after animation
                }}
                student={selectedStudent}
                windowId={windowId}
                onRecordUpdated={fetchRecords}
            />
        </>
    );
}
