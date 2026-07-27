import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import Dropdown from '@/components/ui/Dropdown';
import AsyncDropdown from '@/components/ui/AsyncDropdown';
import { useAuthStore } from '@/store/useAuthStore';
import { getStudentFilterOptions } from '@/services/student.service';

export default function FilterWindowsModal({
    isOpen,
    showHostel = true,
    onClose,
    filters = {},
    onApply,
    onReset
}) {
    const role = useAuthStore((state) => state.user?.role);
    const [localFromDate, setLocalFromDate] = useState('');
    const [localToDate, setLocalToDate] = useState('');
    const [localStatus, setLocalStatus] = useState('');
    const [localHostelId, setLocalHostelId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalFromDate(filters.fromDate || '');
            setLocalToDate(filters.toDate || '');
            setLocalStatus(filters.status || '');
            setLocalHostelId(filters.hostelId || '');
        }
    }, [isOpen, filters]);

    const fetchHostelOptions = async (page, search) => {
        if (!role) return { options: [], hasMore: false };
        try {
            const data = await getStudentFilterOptions(role, { filterType: 'hostel', page, search, limit: 10 });
            return {
                options: data?.options || [],
                hasMore: data?.hasMore || false
            };
        } catch (error) {
            console.error('Error fetching hostel options:', error);
            return { options: [], hasMore: false };
        }
    };

    const handleReset = () => {
        setLocalFromDate('');
        setLocalToDate('');
        setLocalStatus('');
        setLocalHostelId('');
        if (onReset) onReset();
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                fromDate: localFromDate,
                toDate: localToDate,
                status: localStatus,
                ...(showHostel && { hostelId: localHostelId })
            });
        }
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            title="Filter Attendance Windows"
            titleSize="text-lg"
            subtitle="Filter attendance windows by date range or status"
            maxWidth="max-w-md"
            overflowClass="overflow-visible"
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="flex-1 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors"
                    >
                        Filter
                    </button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-5 mt-4">
                <DateInput
                    label="From"
                    value={localFromDate}
                    onChange={(e) => setLocalFromDate(e.target.value)}
                />
                <DateInput
                    label="To"
                    value={localToDate}
                    onChange={(e) => setLocalToDate(e.target.value)}
                />

                {showHostel && (
                    <div className="col-span-2">
                        <label className="block mb-1.5 text-xs font-medium">Hostel</label>
                        <AsyncDropdown
                            fetchOptions={fetchHostelOptions}
                            value={localHostelId}
                            onChange={(val) => setLocalHostelId(val)}
                            placeholder="All Hostels"
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                        />
                    </div>
                )}

                <div className="col-span-2">
                    <label className="block mb-1.5 text-xs font-medium">Status</label>
                    <Dropdown
                        options={[
                            { label: 'All Status', value: '' },
                            { label: 'Open', value: 'open' },
                            { label: 'Completed', value: 'completed' }
                        ]}
                        value={localStatus}
                        onChange={(val) => setLocalStatus(val)}
                        placeholder="Select status"
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                    />
                </div>
            </div>
        </Modal>
    );
}
