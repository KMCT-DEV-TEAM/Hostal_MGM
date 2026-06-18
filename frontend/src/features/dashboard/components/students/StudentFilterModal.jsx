import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { ROLES } from '@/constants/roles';
import { getStudentFilterOptions } from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_FILTERS = { course: '', department: '', hostelId: '', organizationId: '', isActive: '' };
const EMPTY_OPTIONS = { courses: [], departments: [], hostels: [], organizations: [], statuses: [] };

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
    const selectedStatus = options.statuses.find((status) => status.value === filters.isActive);
    const isActiveStatus = filters.isActive === '' || filters.isActive === 'true';

    useEffect(() => {
        if (!role) return;

        setLoading(true);
        setError(null);
        getStudentFilterOptions(role)
            .then((data) => setOptions({ ...EMPTY_OPTIONS, ...(data.filters || {}) }))
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [role]);

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
                        <select
                            value={filters.organizationId}
                            onChange={(e) => updateFilter('organizationId', e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                        >
                            <option value="">Select</option>
                            {options.organizations.map((organization) => (
                                <option key={organization._id} value={organization._id}>
                                    {organization.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {hasOptions(options.courses) && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Course</label>
                        <select
                            value={filters.course}
                            onChange={(e) => updateFilter('course', e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                        >
                            <option value="">Select</option>
                            {options.courses.map((course) => (
                                <option key={course.value} value={course.value}>
                                    {course.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {hasOptions(options.departments) && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Department</label>
                        <select
                            value={filters.department}
                            onChange={(e) => updateFilter('department', e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                        >
                            <option value="">Select</option>
                            {options.departments.map((department) => (
                                <option key={department.value} value={department.value}>
                                    {department.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {(hasOptions(options.hostels) || hasOptions(options.statuses)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hasOptions(options.hostels) && (
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Hostel</label>
                                <select
                                    value={filters.hostelId}
                                    onChange={(e) => updateFilter('hostelId', e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                                >
                                    <option value="">Select</option>
                                    {options.hostels.map((hostel) => (
                                        <option key={hostel._id} value={hostel._id}>
                                            {hostel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {hasOptions(options.statuses) && (
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Status</label>
                                <div className="relative w-fit min-w-32">
                                    <select
                                        value={filters.isActive}
                                        onChange={(e) => updateFilter('isActive', e.target.value)}
                                        className={`appearance-none rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold border outline-none cursor-pointer w-full ${
                                            isActiveStatus
                                                ? 'bg-green-50 text-success border-green-200/60'
                                                : 'bg-red-50 text-danger border-red-200/60'
                                        }`}
                                    >
                                        <option value="">All</option>
                                        {options.statuses.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>

                                    <ChevronDown
                                        size={14}
                                        className={`absolute right-2.5 top-1.5 pointer-events-none ${
                                            isActiveStatus ? 'text-success' : 'text-danger'
                                        }`}
                                    />
                                </div>
                                {selectedStatus && <span className="sr-only">{selectedStatus.label}</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
