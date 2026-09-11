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
import CourseService from '../../../services/course.service';
import organizationService from '../../../services/organization.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { exportToExcel } from '@/utils/exportUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import CourseHeader from '../components/course/CourseHeader';
import CourseTable from '../components/course/CourseTable';

import CourseDetailView from '../components/course/CourseDetailView';
import CourseFormModal from '../components/course/CourseFormModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import Dropdown from '@/components/ui/Dropdown';

const INITIAL_courses = [
    { id: 1, name: 'B.Tech Computer Science', code: 'CS101', batchesCount: 4, status: 'Active' },
    // ... add more as needed
];

const CourseManagement = () => {
    const [courses, setcourses] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalcourses, setTotalcourses] = useState(0);
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
    const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
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
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        organizationId: ''
    });
    const [limit, setLimit] = useState(10);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await CourseService.getCourses({
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                setcourses(res.data);
                const total = res.totalCount || 0;
                setTotalcourses(total);
                setTotalPages(res.totalPages || Math.ceil(total / limit) || 1);
            }
        } catch (err) {
            console.error("Failed to fetch Courses:", err);
            setError("Failed to fetch Courses. Please try again.");
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
        const fetchAllOrganizations = async () => {
            try {
                const res = await organizationService.getOrganizations({ limit: 1000, status: 'Active' });
                if (res && res.data) {
                    setOrganizations(Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : []);
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            }
        };
        fetchAllOrganizations();
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [page, limit, debouncedSearch, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleCourseEvent = () => {
            fetchCourses();
        };

        socket.on('courseCreated', handleCourseEvent);
        socket.on('courseUpdated', handleCourseEvent);
        socket.on('courseDeleted', handleCourseEvent);

        return () => {
            socket.off('courseCreated', handleCourseEvent);
            socket.off('courseUpdated', handleCourseEvent);
            socket.off('courseDeleted', handleCourseEvent);
        };
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

            await CourseService.toggleStatus(statusToUpdate.id, {
                status: isTargetActive ? 'Active' : 'Inactive',
                isActive: isTargetActive
            });
            // Re-fetch or locally update the status
            setcourses((prevcourses) =>
                prevcourses.map((course) =>
                    course.id === statusToUpdate.id ? { ...course, isActive: isTargetActive } : course
                )
            );
            fetchCourses();
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
            showSuccessToast('Status Updated', 'Course status changed successfully');
        } catch (err) {
            console.error("Failed to toggle status:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update status. Please try again.');
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const openModal = (mode, course = null) => {
        setIsEditMode(mode === 'edit');
        if (mode === 'edit' && course) {
            setEditingId(course.id);

            // Extract suffix code
            const orgIdValue = course.organization?.id || course.organizationId;
            const orgCode = course.organization?.code || (organizations.find(o => o.id === orgIdValue)?.code);
            const prefix = orgCode ? `${orgCode}-` : '';
            const suffixCode = course.code?.startsWith(prefix) ? course.code.substring(prefix.length) : course.code;

            setFormData({
                name: course.name || '',
                code: suffixCode || '',
                organizationId: orgIdValue || '',
                status: course.isActive ? 'Active' : 'Inactive',
                isActive: course.isActive,
                originalIsActive: course.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                organizationId: '',
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

    const saveCourse = async () => {
        try {
            setIsSubmitting(true);

            const org = organizations.find(o => o.id === formData.organizationId);
            const prefix = org ? `${org.code}-` : '';
            const finalData = {
                ...formData,
                code: `${prefix}${formData.code}`
            };

            if (isEditMode && editingId) {
                await CourseService.updateCourse(editingId, finalData);
                if (formData.isActive !== formData.originalIsActive) {
                    await CourseService.toggleStatus(editingId, {
                        status: formData.isActive ? 'Active' : 'Inactive',
                        isActive: formData.isActive
                    });
                }
                showSuccessToast('Course Updated', 'Course details saved successfully');
            } else {
                await CourseService.createCourse(finalData);
                showSuccessToast('Course Added', 'New Course registered successfully');
            }
            setIsModalOpen(false);
            setIsEditConfirmOpen(false);
            setIsAddConfirmOpen(false);
            fetchCourses(); // Refresh list after saving
        } catch (err) {
            console.error("Failed to save Course:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to save Course. Please try again.');
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
        const currentVisibleIds = (Array.isArray(mobileIds) && (typeof mobileIds[0] === 'string' || typeof mobileIds[0] === 'number')) ? mobileIds : courses.map(h => h.id);
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
            await CourseService.bulkToggleStatus({ ids: selectedIds, isActive: bulkStatusToUpdate });
            const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
            showSuccessToast('Bulk Status Updated', `Successfully ${action.toLowerCase()} ${selectedIds.length} Courses`);
            setSelectedIds([]); // clear selection
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchCourses(); // refresh table
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

            // Fetch all Courses
            const res = await CourseService.getCourses(params);

            const allcourses = res?.data || [];

            if (allcourses && allcourses.length > 0) {
                const exportData = allcourses.map((course, index) => ({
                    "S.No": index + 1,
                    "Course Name": course.name,
                    "Course Code": course.code,
                    "Organization": course.organization?.name || 'N/A',
                    "Number of Departments": course.departmentsCount || 0,
                    "Number of Batches": course.batchesCount || 0,
                    "Status": course.isActive ? "Active" : "Inactive",
                    "Created At": new Date(course.createdAt).toLocaleDateString()
                }));

                const isSuccess = exportToExcel(exportData, "Courses_Export", "Courses");

                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The Course list has been downloaded.');
                } else {
                    showErrorToast('Export Failed', 'Could not generate the Excel file.');
                }
            } else {
                showErrorToast('Export Failed', 'No data available to export matching the filters.');
            }
        } catch (err) {
            console.error("Failed to export Courses:", err);
            showErrorToast('Export Failed', err?.message || 'Failed to export Courses. Please try again.');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };







    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <CourseHeader />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                <CourseTable
                    courses={courses}
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
                    setSelectedCourseDetail={setSelectedCourseDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openModal={openModal}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalItems={totalcourses}
                    totalPages={totalPages}
                />
            </div>

            <CourseFormModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                isEditMode={isEditMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                isSubmitting={isSubmitting}
                organizations={organizations}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Courses Data"
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
                                onClick={saveCourse}
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
                message={`Are you sure you want to change the status of this Course to ${statusToUpdate?.targetStatus || 'the new status'}?`}
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
                message={`Are you sure you want to change the status for the ${selectedIds.length} selected Course(s)?`}
            />

            {view === 'detail' && (
                <CourseDetailView
                    selectedCourseDetail={selectedCourseDetail}
                    setView={setView}
                />
            )}


            <ConfirmationModal
                isOpen={isAddConfirmOpen}
                onClose={() => setIsAddConfirmOpen(false)}
                onConfirm={saveCourse}
                isSubmitting={isSubmitting}
                title="Add Course"
                message="Are you sure you want to add this new course?"
            />
            </div>
        </div>
    );
};

export default CourseManagement;


