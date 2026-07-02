import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import { formatDate } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import StudentAttendanceModal from './StudentAttendanceModal';
import FilterAttendanceModal from './FilterAttendanceModal';
import { Filter } from 'lucide-react';

export default function AttendanceRecordsTable({ windowId }) {
    const { user } = useAuthStore();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [pagination, setPagination] = useState({
        totalRecords: 0,
        totalPages: 1
    });

    const fetchRecords = useCallback(async () => {
        if (!user?.role || !windowId) return;
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
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
    }, [windowId, user?.role, page, searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRecords();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchRecords]);

    // Format headers matching the image exactly
    const headers = [
        'Day',
        'Date',
        'Student',
        'Room No',
        'Status'
    ];

    const renderRow = (item) => {
        const dateObj = new Date(item.scannedAt);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        return (
            <>
                <td className="p-4 align-middle text-gray-500">
                    {dayOfWeek}
                </td>
                <td className="p-4 align-middle text-gray-500">
                    {formatDate(item.scannedAt)}
                </td>
                <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                        {item.student?.profileImage ? (
                            <img src={item.student.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                                {item.student?.name?.substring(0, 2).toUpperCase() || 'ST'}
                            </div>
                        )}
                        <span className="font-medium text-gray-700">{item.student?.name || 'Unknown'}</span>
                    </div>
                </td>
                <td className="p-4 align-middle text-gray-500">
                    {item.student?.room || 'N/A'}
                </td>
                <td className="p-4 align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-medium w-[130px] ${item.status === 'present' ? 'bg-green-50 text-green-700' :
                        item.status === 'absent' ? 'bg-red-50 text-red-700' :
                            'bg-orange-50 text-orange-700'
                        }`}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
                    </span>
                </td>
            </>
        );
    };

    const renderMobileItem = (item) => {
        const dateObj = new Date(item.scannedAt);
        return (
            <div className="flex flex-col gap-3 w-full text-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {item.student?.profileImage ? (
                            <img src={item.student.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-xs font-medium">
                                {item.student?.name?.substring(0, 2).toUpperCase() || 'ST'}
                            </div>
                        )}
                        <span className="font-semibold text-gray-900">{item.student?.name || 'Unknown'}</span>
                    </div>
                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium w-[130px] ${item.status === 'present' ? 'bg-green-50 text-green-700' :
                        item.status === 'absent' ? 'bg-red-50 text-red-700' :
                            'bg-orange-50 text-orange-700'
                        }`}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
                    </span>
                </div>
                <div className="text-gray-600 grid grid-cols-2 gap-2 mt-2">
                    <div>
                        <span className="font-medium">Date:</span> {formatDate(item.scannedAt)}
                    </div>
                    <div>
                        <span className="font-medium">Room:</span> {item.student?.room || 'N/A'}
                    </div>
                </div>
            </div>
        );
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

    return (
        <>
            <DataTable
                searchQuery={searchQuery}
                onSearchChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                }}
                searchPlaceholder="Search student..."
                toolbarActions={
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2 rounded-md transition-colors ${Object.keys(filters).length > 0 ? 'bg-primary text-white hover:bg-secondary' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        title="Filter records"
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                }
                headers={headers}
                items={records}
                loading={loading}
                renderRow={renderRow}
                renderMobileItem={renderMobileItem}
                onRowClick={(item) => {
                    if (item.student) {
                        setSelectedStudent(item.student);
                        setIsModalOpen(true);
                    }
                }}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
                emptyText="No records found."
            />

            <StudentAttendanceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTimeout(() => setSelectedStudent(null), 200); // Clear after animation
                }}
                student={selectedStudent}
            />

            <FilterAttendanceModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApply={(newFilters) => {
                    // Remove empty filters
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
