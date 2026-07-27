import React, { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import AsyncDropdown from '@/components/ui/AsyncDropdown';
import { ROLES } from '@/constants/roles';
import { getStudentFilterOptions } from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_FILTERS = {
    courseId: '',
    departmentId: '',
    hostelId: '',
    organizationId: '',
    isActive: ''
};

export default function StudentFilterModal({ initialFilters, onClose, onApply }) {
    const role = useAuthStore((state) => state.user?.role);
    const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
    
    const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        onApply(DEFAULT_FILTERS);
    };

    const isActiveStatus = filters.isActive === '' || filters.isActive === 'true';

    const createFetchOptions = useCallback((filterType) => {
        return async ({ page, search }) => {
            if (!role) return { options: [], hasMore: false };
            try {
                const data = await getStudentFilterOptions(role, { 
                    filterType, 
                    search, 
                    page, 
                    organizationId: filters.organizationId 
                });
                
                return {
                    options: data?.options || [],
                    hasMore: !!data?.hasMore,
                };
            } catch (error) {
                console.error(`Failed to load ${filterType} options`, error);
                return { options: [], hasMore: false };
            }
        };
    }, [role, filters.organizationId]);

    const statusOptions = [
        { value: '', label: 'All' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
    ];

    return (
        <Modal bottomSheetOnMobile={true}
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
            <div className="space-y-6">
                {role === ROLES.SUPER_ADMIN && (
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Organization</label>
                        <AsyncDropdown
                            fetchOptions={createFetchOptions('organization')}
                            value={filters.organizationId}
                            onChange={(value) => updateFilter('organizationId', value)}
                            placeholder="Select"
                            className="w-full"
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs mb-1.5 font-medium">Course</label>
                    <AsyncDropdown
                        fetchOptions={createFetchOptions('course')}
                        value={filters.courseId}
                        onChange={(value) => updateFilter('courseId', value)}
                        placeholder="Select"
                        className="w-full"
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
                    />
                </div>

                <div>
                    <label className="block text-xs mb-1.5 font-medium">Department</label>
                    <AsyncDropdown
                        fetchOptions={createFetchOptions('department')}
                        value={filters.departmentId}
                        onChange={(value) => updateFilter('departmentId', value)}
                        placeholder="Select"
                        className="w-full"
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Hostel</label>
                        <AsyncDropdown
                            fetchOptions={createFetchOptions('hostel')}
                            value={filters.hostelId}
                            onChange={(value) => updateFilter('hostelId', value)}
                            placeholder="Select"
                            className="w-full"
                            triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary"
                        />
                    </div>

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
                </div>
            </div>
        </Modal>
    );
}
