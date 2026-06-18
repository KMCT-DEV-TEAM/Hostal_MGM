import React, { useCallback, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getStudentPermissions } from '@/features/dashboard/config/studentPermissions';
import { useStudents } from '@/features/dashboard/hooks/useStudents';
import { createStudent, toggleStudentStatus, bulkUpdateStudentStatus, updateStudent } from '@/services/student.service';
import StudentsTable from '../components/students/StudentsTable';
import StudentsHeader from '../components/students/StudentsHeader';
import StudentsToolbar from '../components/students/StudentsToolbar';
import StudentFormModal from '../components/students/StudentFormModal';
import StudentFilterModal from '../components/students/StudentFilterModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function Students() {
    const role = useAuthStore((s) => s.user?.role);
    const { canEdit, canDelete, canCreate } = getStudentPermissions(role);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [statusLoadingIds, setStatusLoadingIds] = useState([]);
    const [pendingConfirm, setPendingConfirm] = useState(null);
    const [filters, setFilters] = useState({ search: '', course: '', department: '', hostelId: '', organizationId: '', isActive: '' });

    const { students, setStudents, loading, error, refetch } = useStudents(filters);
    const getStudentId = (student) => student._id ?? student.id;
    const applyStatusChange = (ids, response) => {
        const changedIds = new Set(Array.isArray(ids) ? ids : [ids]);
        const nextIsActive = response?.isActive;

        if (typeof nextIsActive !== 'boolean') return;

        setStudents((prev) => prev.map((student) => (
            changedIds.has(getStudentId(student))
                ? { ...student, isActive: nextIsActive }
                : student
        )));
    };

    const handleEditClick = (student) => {
        setEditingStudent(student);
        setActiveModal('student');
    };

    const handleAddClick = () => {
        setEditingStudent(null);
        setActiveModal('student');
    };

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.length === students.length ? [] : students.map(getStudentId));
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkStatusChange = async (targetActive, idsToToggle) => {
        if (!idsToToggle.length) return;

        setStatusLoadingIds((prev) => [...new Set([...prev, ...idsToToggle])]);

        try {
            await bulkUpdateStudentStatus(role, { ids: idsToToggle, isActive: targetActive });
            setStudents((prev) => prev.map((student) => (
                idsToToggle.includes(getStudentId(student))
                    ? { ...student, isActive: targetActive }
                    : student
            )));
            setSelectedIds([]);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((id) => !idsToToggle.includes(id)));
        }
    };

    const prepareBulkStatusChange = (targetActive) => {
        if (!selectedIds.length) return;

        const idsToToggle = selectedIds.filter((id) => {
            const student = students.find((student) => getStudentId(student) === id);
            return student ? student.isActive !== targetActive : false;
        });

        if (!idsToToggle.length) {
            setSelectedIds([]);
            return;
        }

        setPendingConfirm({
            title: targetActive ? 'Confirm Activation' : 'Confirm Deactivation',
            message: `Are you sure you want to ${targetActive ? 'activate' : 'deactivate'} ${idsToToggle.length} selected student(s)?`,
            confirmText: targetActive ? 'Activate' : 'Deactivate',
            confirmAction: () => handleBulkStatusChange(targetActive, idsToToggle),
        });
    };

    const handleActivateSelected = () => {
        if (!canEdit) return;
        prepareBulkStatusChange(true);
    };

    const handleDeactivateSelected = () => {
        if (!canDelete) return;
        prepareBulkStatusChange(false);
    };

    const confirmDeleteRow = async (id) => {
        setStatusLoadingIds((prev) => [...new Set([...prev, id])]);

        try {
            const response = await toggleStudentStatus(role, id);
            applyStatusChange(id, response);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
        }
    };

    const handleDeleteRow = async (id) => {
        if (!canDelete) return;

        setPendingConfirm({
            title: 'Confirm Deactivation',
            message: 'Are you sure you want to deactivate this student?',
            confirmText: 'Deactivate',
            confirmAction: () => confirmDeleteRow(id),
        });
    };

    const handleStatusChange = async (id) => {
        if (!canEdit) return;
        setStatusLoadingIds((prev) => [...new Set([...prev, id])]);

        try {
            const response = await toggleStudentStatus(role, id);
            applyStatusChange(id, response);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
        }
    };

    const handleSearch = useCallback((query) => {
        setFilters((prev) => ({ ...prev, search: query }));
    }, []);

    const handleApplyFilter = (next) => {
        setFilters((prev) => ({ ...prev, ...next }));
        setIsFilterModalOpen(false);
    };

    const handleSaveStudent = async (payload) => {
        if (editingStudent) {
            await updateStudent(getStudentId(editingStudent), payload);
        } else {
            await createStudent(payload);
        }

        setActiveModal(null);
        setEditingStudent(null);
        refetch();
    };

    const handleExport = () => {
        const headers = ['Student ID', 'Name', 'Email', 'Phone', 'Course', 'Department', 'Status'];
        const rows = students.map((student) => [
            student.studentId,
            student.name,
            student.email,
            student.phone,
            student.course,
            student.department,
            student.isActive ? 'Active' : 'Inactive',
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
            .join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'students.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            <StudentsHeader
                selectedIds={selectedIds}
                students={students}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={handleEditClick}
                onActivateSelected={handleActivateSelected}
                onDeactivateSelected={handleDeactivateSelected}
            />

            <StudentsToolbar
                canCreate={canCreate}
                searchValue={filters.search}
                onSearch={handleSearch}
                onFilterClick={() => setIsFilterModalOpen(true)}
                onExport={handleExport}
                onAddClick={handleAddClick}
            />

            <StudentsTable
                students={students}
                loading={loading}
                error={error}
                canEdit={canEdit}
                canDelete={canDelete}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectRow={handleSelectRow}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteRow}
                onStatusChange={handleStatusChange}
                statusLoadingIds={statusLoadingIds}
            />

            {activeModal === 'student' && (
                <StudentFormModal
                    editingStudent={editingStudent}
                    onClose={() => { setActiveModal(null); setEditingStudent(null); }}
                    onSave={handleSaveStudent}
                />
            )}

            {isFilterModalOpen && (
                <StudentFilterModal
                    initialFilters={filters}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={handleApplyFilter}
                />
            )}

            <ConfirmationModal
                isOpen={!!pendingConfirm}
                onClose={() => setPendingConfirm(null)}
                onConfirm={() => pendingConfirm?.confirmAction?.()}
                title={pendingConfirm?.title}
                message={pendingConfirm?.message}
                confirmText={pendingConfirm?.confirmText}
                cancelText="Cancel"
            />
        </div>
    );
}
