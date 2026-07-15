import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import { ROLES } from '@/constants/roles';
import { getStudentFilterOptions } from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_FILTERS = {
    courseId: '',
    departmentId: '',
    batchId: '',
    organizationId: '',
    status: ''
};
const EMPTY_OPTIONS = { courses: [], departments: [], batches: [], organizations: [], statuses: [] };

export default function FilterRecordsModal({ initialFilters, onClose, onApply, onFilterChange }) {
    const role = useAuthStore((state) => state.user?.role);
    const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
    const [options, setOptions] = useState(EMPTY_OPTIONS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const updateFilter = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };
    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        onApply(DEFAULT_FILTERS);
    };

    const hasOptions = (items) => Array.isArray(items) && items.length > 0;

    useEffect(() => {
        setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
    }, [initialFilters]);

    useEffect(() => {
        if (!role) return;

        setLoading(true);
        setError(null);
        getStudentFilterOptions(role)
            .then((data) => {
                const filters = data.filters;
                setOptions({
                    courses: filters?.courses || [],
                    departments: filters?.departments || [],
                    batches: filters?.batches || [],
                    organizations: filters?.organizations || [],
                    statuses: filters?.statuses || [] // Usually active/inactive for students, but we'll override below for attendance records
                });
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [role]);

    const organizationOptions = [
        { value: '', label: 'Select' },
        ...options.organizations.map((organization) => ({
            value: organization.value,
            label: organization.label,
        })),
    ];

    const courseOptions = [
        { value: '', label: 'Select' },
        ...options.courses.map((course) => ({
            value: course.value,
            label: course.label,
        })),
    ];

    const departmentOptions = [
        { value: '', label: 'Select' },
        ...options.departments.map((department) => ({
            value: department.value,
            label: department.label,
        })),
    ];

    const batchOptions = [
        { value: '', label: 'Select' },
        ...options.batches.map((batch) => ({
            value: batch.value,
            label: batch.label,
        })),
    ];

    // Status is specific for attendance records, override student statuses.
    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'present', label: 'Present' },
        { value: 'absent', label: 'Absent' },
        { value: 'on_leave', label: 'On Leave' },
    ];

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={true}
            onClose={onClose}
            title="Filter Records"
            maxWidth="max-w-md"
            footer={
                <>
                    <button type="button" onClick={resetFilters} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">Reset</button>
                    <button type="button" onClick={() => onApply(filters)} className="flex-1 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors">Filter</button>
                </>
            }
        >
            {loading && <p className="text-xs text-gray-400">Loading filters...</p>}
            {error && <p className="text-xs text-danger">Failed to load filter options.</p>}

            <div className="space-y-6">
                {role === ROLES.SUPER_ADMIN && hasOptions(options.organizations) && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Organization</label>
                        <Dropdown
                            options={organizationOptions}
                            value={filters.organizationId}
                            onChange={(value) => updateFilter('organizationId', value)}
                            placeholder="Select"
                            className="w-full"
                            minWidth=""
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                        />
                    </div>
                )}

                {hasOptions(options.courses) && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Course</label>
                        <Dropdown
                            options={courseOptions}
                            value={filters.courseId}
                            onChange={(value) => updateFilter('courseId', value)}
                            placeholder="Select"
                            className="w-full"
                            minWidth=""
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                        />
                    </div>
                )}

                {hasOptions(options.departments) && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Department</label>
                        <Dropdown
                            options={departmentOptions}
                            value={filters.departmentId}
                            onChange={(value) => updateFilter('departmentId', value)}
                            placeholder="Select"
                            className="w-full"
                            minWidth=""
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                        />
                    </div>
                )}

                {hasOptions(options.batches) && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Batch</label>
                        <Dropdown
                            options={batchOptions}
                            value={filters.batchId}
                            onChange={(value) => updateFilter('batchId', value)}
                            placeholder="Select"
                            className="w-full"
                            minWidth=""
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs mb-1.5 font-medium">Status</label>
                    <Dropdown
                        options={statusOptions}
                        value={filters.status}
                        onChange={(value) => updateFilter('status', value)}
                        placeholder="All"
                        className="w-full"
                        minWidth=""
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border border-gray-200 focus:border-secondary transition-colors rounded-lg flex justify-between items-center"
                    />
                </div>
            </div>
        </Modal>
    );
}
