import React, { useState, useEffect } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import {
    Square, Pencil, Trash2, Plus, Search,
    Download, Mail, Phone, MapPin,
    ChevronDown, Loader2, X,
    CheckSquare,
    Building2,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DepartmentService from '../../../services/department.service';
import CourseService from '../../../services/course.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { exportToExcel } from '@/utils/exportUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import DepartmentHeader from '../components/department/DepartmentHeader';
import DepartmentTable from '../components/department/DepartmentTable';

import DepartmentDetailView from '../components/department/DepartmentDetailView';
import DepartmentFormModal from '../components/department/DepartmentFormModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import Dropdown from '@/components/ui/Dropdown';

const INITIAL_Departments = [
    { id: 1, name: 'B.Tech Computer Science', code: 'CS101', batchesCount: 4, status: 'Active' },
    // ... add more as needed
];

const DepartmentManagement = () => {
    const [Departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalDepartments, setTotalDepartments] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedDepartmentDetail, setSelectedDepartmentDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isBulkStatusUpdating, setIsBulkStatusUpdating] = useState(false);
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        courseId: ''
    });
    const [limit, setLimit] = useState(10);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await DepartmentService.getDepartments({
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                setDepartments(res.data);
                const total = res.totalCount || 0;
                setTotalDepartments(total);
                setTotalPages(res.totalPages || Math.ceil(total / limit) || 1);
            }
        } catch (err) {
            console.error("Failed to fetch Departments:", err);
            setError("Failed to fetch Departments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchDepartments();
    }, [page, limit, debouncedSearch, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleDepartmentEvent = () => {
            fetchDepartments();
        };

        socket.on('departmentCreated', handleDepartmentEvent);
        socket.on('departmentUpdated', handleDepartmentEvent);
        socket.on('departmentDeleted', handleDepartmentEvent);

        return () => {
            socket.off('departmentCreated', handleDepartmentEvent);
            socket.off('departmentUpdated', handleDepartmentEvent);
            socket.off('departmentDeleted', handleDepartmentEvent);
        };
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await CourseService.getCourses({ limit: 0 });
                if (res && res.data) {
                    setCourses(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch courses:", err);
            }
        };
        fetchCourses();
    }, []);

    const handleStatusChangeClick = (id, targetStatus) => {
        setStatusToUpdate({ id, targetStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        setIsStatusUpdating(true);
        try {
            const isTargetActive = typeof statusToUpdate.targetStatus === 'boolean'
                ? statusToUpdate.targetStatus
                : statusToUpdate.targetStatus === 'Active' || statusToUpdate.targetStatus === 'active';

            await DepartmentService.toggleStatus(statusToUpdate.id, {
                status: isTargetActive ? 'Active' : 'Inactive',
                isActive: isTargetActive
            });
            // Re-fetch or locally update the status
            setDepartments((prevDepartments) =>
                prevDepartments.map((Department) =>
                    Department.id === statusToUpdate.id ? { ...Department, isActive: isTargetActive } : Department
                )
            );
            fetchDepartments();
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
            showSuccessToast('Status Updated', 'Department status changed successfully');
        } catch (err) {
            console.error("Failed to toggle status:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update status. Please try again.');
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const openModal = (mode, Department = null) => {
        setIsEditMode(mode === 'edit');
        if (mode === 'edit' && Department) {
            setEditingId(Department.id);

            // Extract suffix code
            const courseIdValue = Department.course?.id || Department.courseId;
            const courseCode = Department.course?.code || (courses.find(c => c.id === courseIdValue)?.code);
            const prefix = courseCode ? `${courseCode}-` : '';
            const suffixCode = Department.code?.startsWith(prefix) ? Department.code.substring(prefix.length) : Department.code;

            setFormData({
                name: Department.name || '',
                code: suffixCode || '',
                courseId: courseIdValue || '',
                status: Department.isActive ? 'Active' : 'Inactive',
                isActive: Department.isActive,
                originalIsActive: Department.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                courseId: '',
                status: 'Active',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditMode) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const saveDepartment = async () => {
        try {
            setIsSubmitting(true);

            const course = courses.find(c => c.id === formData.courseId);
            const prefix = course ? `${course.code}-` : '';
            const finalData = {
                ...formData,
                code: `${prefix}${formData.code}`
            };

            if (isEditMode && editingId) {
                await DepartmentService.updateDepartment(editingId, finalData);
                if (formData.isActive !== formData.originalIsActive) {
                    await DepartmentService.toggleStatus(editingId);
                }
                showSuccessToast('Department Updated', 'Department details saved successfully');
            } else {
                await DepartmentService.createDepartment(finalData);
                showSuccessToast('Department Added', 'New Department registered successfully');
            }
            setIsModalOpen(false);
            setIsEditConfirmOpen(false);
            setIsAddConfirmOpen(false);
            fetchDepartments(); // Refresh list after saving
        } catch (err) {
            console.error("Failed to save Department:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to save Department. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsDiscardConfirmOpen(true);
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setIsModalOpen(false);
    };

    const handleSelectAll = (mobileIds) => {
        // Use id
        const currentVisibleIds = (Array.isArray(mobileIds) && (typeof mobileIds[0] === 'string' || typeof mobileIds[0] === 'number')) ? mobileIds : Departments.map(h => h.id);
        const allSelected = currentVisibleIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(selectedIds.filter(id => !currentVisibleIds.includes(id)));
        } else {
            setSelectedIds([...new Set([...selectedIds, ...currentVisibleIds])]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = async () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;
        setIsBulkStatusUpdating(true);
        try {
            await DepartmentService.bulkToggleStatus({ ids: selectedIds, isActive: bulkStatusToUpdate });
            const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
            showSuccessToast('Bulk Status Updated', `Successfully ${action.toLowerCase()} ${selectedIds.length} Departments`);
            setSelectedIds([]); // clear selection
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchDepartments(); // refresh table
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to bulk update status. Please try again.');
        } finally {
            setIsBulkStatusUpdating(false);
        }
    };

    // Step 1: Trigger the dialog
    const initiateExport = () => {
        setIsExportConfirmOpen(true);
    };

    // Step 2: The actual export logic
    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = { page: 1, limit: 100000 };
            if (debouncedSearch) params.search = debouncedSearch;

            // Allow export modal filter to override table filter completely
            if (exportFilters.isActive === 'true') {
                params.status = 'Active';
            } else if (exportFilters.isActive === 'false') {
                params.status = 'Inactive';
            } else {
                delete params.status;
            }

            // Fetch all Departments
            const res = await DepartmentService.getDepartments(params);

            const responseData = res?.data || res;
            const allDepartments = responseData?.data || responseData || [];

            if (allDepartments && allDepartments.length > 0) {
                const exportData = allDepartments.map((Department, index) => ({
                    "S.No": index + 1,
                    "Department Name": Department.name,
                    "Department Code": Department.code,
                    "Number of Batches": Department.batchesCount || 0,
                    "Status": Department.isActive ? "Active" : "Inactive",
                    "Created At": new Date(Department.createdAt).toLocaleDateString()
                }));

                const isSuccess = exportToExcel(exportData, "Departments_Export", "Departments");

                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The Department list has been downloaded.');
                } else {
                    showErrorToast('Export Failed', 'Could not generate the Excel file.');
                }
            } else {
                showErrorToast('Export Failed', 'No data available to export matching the filters.');
            }
        } catch (err) {
            console.error("Failed to export Departments:", err);
            showErrorToast('Export Failed', err?.message || 'Failed to export Departments. Please try again.');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <DepartmentHeader />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                <DepartmentTable
                    Departments={Departments}
                    loading={loading}
                    error={error}
                    searchValue={searchQuery}
                    onSearch={(val) => { setSearchQuery(val); setPage(1); }}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
                    onExport={initiateExport}
                    onAddClick={() => openModal('add')}
                    onActivateSelected={() => handleBulkStatusClick(true)}
                    onDeactivateSelected={() => handleBulkStatusClick(false)}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedDepartmentDetail={setSelectedDepartmentDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openModal={openModal}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalItems={totalDepartments}
                    totalPages={totalPages}
                />
            </div>

            <DepartmentFormModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                isEditMode={isEditMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                isSubmitting={isSubmitting}
                courses={courses}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Departments Data"
                fields={[
                    {
                        name: "isActive",
                        label: "Account Status",
                        options: [
                            { label: 'All Status', value: 'all' },
                            { label: 'Active Only', value: 'true' },
                            { label: 'Inactive Only', value: 'false' },
                        ],
                        defaultValue: statusFilter === 'Active' ? 'true' : (statusFilter === 'Inactive' ? 'false' : 'all')
                    }
                ]}
            />

            {isEditConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Save Changes</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to save these changes?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsEditConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveDepartment}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <ConfirmationModal
                isOpen={isDiscardConfirmOpen}
                onClose={() => setIsDiscardConfirmOpen(false)}
                onConfirm={confirmDiscard}
                title="Discard Changes"
                message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
                confirmText="Discard"
                confirmButtonClass="bg-danger hover:bg-danger/90"
                cancelText="Continue Editing"
            />



            <ConfirmationModal
                isOpen={isStatusConfirmOpen}
                onClose={() => {
                    setIsStatusConfirmOpen(false);
                    setStatusToUpdate(null);
                }}
                onConfirm={confirmStatusChange}
                isSubmitting={isStatusUpdating}
                title="Change Status"
                message={`Are you sure you want to change the status of this Department to ${statusToUpdate?.targetStatus || 'the new status'}?`}
            />



            <ConfirmationModal
                isOpen={isBulkStatusConfirmOpen}
                onClose={() => {
                    setIsBulkStatusConfirmOpen(false);
                    setBulkStatusToUpdate(null);
                }}
                onConfirm={confirmBulkStatusChange}
                isSubmitting={isBulkStatusUpdating}
                title="Change Status (Bulk)"
                message={`Are you sure you want to change the status for the ${selectedIds.length} selected Department(s)?`}
            />

            {view === 'detail' && (
                <DepartmentDetailView
                    selectedDepartmentDetail={selectedDepartmentDetail}
                    setView={setView}
                />
            )}


            <ConfirmationModal
                isOpen={isAddConfirmOpen}
                onClose={() => setIsAddConfirmOpen(false)}
                onConfirm={saveDepartment}
                isSubmitting={isSubmitting}
                title="Add Department"
                message="Are you sure you want to add this new department?"
            />
            </div>
        </div>
    );
};

export default DepartmentManagement;


