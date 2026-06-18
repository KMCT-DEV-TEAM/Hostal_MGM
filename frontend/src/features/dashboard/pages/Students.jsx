import React, { useState } from 'react';
import StudentsHeader from '../components/students/StudentsHeader';
import StudentsToolbar from '../components/students/StudentsToolbar';
import StudentsTable from '../components/students/StudentsTable';
import StudentFormModal from '../components/students/StudentFormModal';
import StudentFilterModal from '../components/students/StudentFilterModal';

const INITIAL_STUDENTS = [
    { id: 1, admissionNo: 'A112390', name: 'Nila Mohan', course: 'B.Tech CSE', dept: 'CSE', orgId: 'A112390', hostel: 'Hostel A', status: 'Active' },
];

export default function Students() {
    const [students, setStudents] = useState(INITIAL_STUDENTS);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const handleEditClick = (student) => {
        setEditingStudent(student);
        setActiveModal('edit-student');
    };

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.id));
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} student(s)?`)) {
            setStudents(students.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
        }
    };

    const handleAddClick = () => {
        setEditingStudent(null);
        setActiveModal('student');
    };

    const handleSearch = (query) => {
        console.log("Search query:", query);
    };

    const handleExport = () => {
        console.log("Exporting students...");
    };

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            <StudentsHeader 
                selectedIds={selectedIds}
                students={students}
                onEdit={handleEditClick}
                onDeleteSelected={handleDeleteSelected}
            />

            <StudentsToolbar 
                onSearch={handleSearch}
                onFilterClick={() => setIsFilterModalOpen(true)}
                onExport={handleExport}
                onAddClick={handleAddClick}
            />

            <StudentsTable 
                students={students}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectRow={handleSelectRow}
                onEditClick={handleEditClick}
            />

            {(activeModal === 'student' || activeModal === 'edit-student') && (
                <StudentFormModal 
                    editingStudent={editingStudent}
                    onClose={() => { setActiveModal(null); setEditingStudent(null); }}
                    onSave={() => { setActiveModal(null); setEditingStudent(null); }}
                />
            )}

            {isFilterModalOpen && (
                <StudentFilterModal 
                    onClose={() => setIsFilterModalOpen(false)}
                    onFilter={() => console.log('Filtering...')}
                />
            )}
        </div>
    );
}