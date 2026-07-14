import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import InfoCard from '@/components/ui/InfoCard';
import { formatDateISO, formatDateReadable } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import StudentAttendanceModal from '../StudentAttendanceModal';
import StatusBadge from '@/components/ui/StatusBadge';
import Dropdown from '@/components/ui/Dropdown';

export default function AttendanceRecordsTable({ windowId }) {
    const { user } = useAuthStore();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                    {formatDateISO(item.scannedAt)}
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
                    <StatusBadge status={item.status || 'pending'} className="w-[130px]" />
                </td>
            </>
        );
    };

    const renderMobileItem = (item) => {
        return (
            <div className="">
                <InfoCard
                    onClick={() => {
                        if (item.student) {
                            setSelectedStudent(item.student);
                            setIsModalOpen(true);
                        }
                    }}
                    avatar={item.student?.profileImage || item.student?.name || 'ST'}
                    title={item.student?.name || 'Unknown'}
                    fields={[
                        { label: "Date", value: formatDateReadable(item.scannedAt) },
                        { label: "Room", value: item.student?.room || 'N/A' }
                    ]}
                    status={{ text: item.status || 'pending', color: item.status === 'present' ? 'green' : item.status === 'absent' ? 'red' : item.status === 'on_leave' ? 'orenge' : 'default' }}
                />
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
                filterOptions={[
                    { label: 'All Status', value: '' },
                    { label: 'Present', value: 'present' },
                    { label: 'Absent', value: 'absent' },
                    { label: 'On Leave', value: 'on_leave' }
                ]}
                filterValue={filters.status || ''}
                onFilterChange={(val) => {
                    if (val) {
                        setFilters({ status: val });
                    } else {
                        setFilters({});
                    }
                    setPage(1);
                }}
                filterPlaceholder="Filter Status"
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
                windowId={windowId}
                onRecordUpdated={fetchRecords}
            />
        </>
    );
}
