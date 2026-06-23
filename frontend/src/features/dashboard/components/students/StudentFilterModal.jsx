import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import { ROLES } from '@/constants/roles';
import { getStudentFilterOptions } from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_FILTERS = {
    courseId: '',
    departmentId: '',
    hostelId: '',
    organizationId: '',
    isActive: ''
}; const EMPTY_OPTIONS = { courses: [], departments: [], hostels: [], organizations: [], statuses: [] };

export default function StudentFilterModal({ initialFilters, onClose, onApply }) {
    const role = useAuthStore((state) => state.user?.role);
    const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
    const [options, setOptions] = useState(EMPTY_OPTIONS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        onApply(DEFAULT_FILTERS);
    };

    const hasOptions = (items) => Array.isArray(items) && items.length > 0;
    const isActiveStatus = filters.isActive === '' || filters.isActive === 'true';

    useEffect(() => {
        if (!role) return;

        setLoading(true);
        setError(null);
        getStudentFilterOptions(role)
            .then((data) => {
                console.log("FILTER OPTIONS", data);
                setOptions({ ...EMPTY_OPTIONS, ...(data.filters || {}) });
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [role]);

    // Normalize each option list into { value, label } pairs that Dropdown expects,
    // with a leading "clear" option so filters can be reset to "All"/"Select".
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

    const hostelOptions = [
        { value: '', label: 'Select' },
        ...options.hostels.map((hostel) => ({
            value: hostel.value,
            label: hostel.label,
        })),
    ];

    const statusOptions = [
        { value: '', label: 'All' },
        ...options.statuses.map((status) => ({
            value: status.value,
            label: status.label,
        })),
    ];

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Filter Students"
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
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
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
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
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
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
                        />
                    </div>
                )}

                {(hasOptions(options.hostels) || hasOptions(options.statuses)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hasOptions(options.hostels) && (
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Hostel</label>
                                <Dropdown
                                    options={hostelOptions}
                                    value={filters.hostelId}
                                    onChange={(value) => updateFilter('hostelId', value)}
                                    placeholder="Select"
                                    className="w-full"
                                    minWidth=""
                                    triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
                                />
                            </div>
                        )}

                        {hasOptions(options.statuses) && (
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Status</label>
                                <Dropdown
                                    options={statusOptions}
                                    value={filters.isActive}
                                    onChange={(value) => updateFilter('isActive', value)}
                                    placeholder="All"
                                    className="w-fit min-w-32"
                                    minWidth=""
                                    triggerClassName={`rounded-full pl-3 pr-2.5 py-1.5 text-xs font-semibold border cursor-pointer w-full ${isActiveStatus
                                        ? 'bg-green-50 text-success border-green-200/60'
                                        : 'bg-red-50 text-danger border-red-200/60'
                                        }`}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}