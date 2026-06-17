import React, { useState } from 'react';
import { Square, CheckSquare, Pencil, Trash2, Plus, Search, ChevronDown, Download, SlidersHorizontal, X } from 'lucide-react';

const INITIAL_STUDENTS = [
    { id: 1, admissionNo: 'A112390', name: 'Nila Mohan', course: 'B.Tech CSE', dept: 'CSE', orgId: 'A112390', hostel: 'Hostel A', status: 'Active' },
];

export default function Students() {
    const [students, setStudents] = useState(INITIAL_STUDENTS);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // 2. Function to open modal for editing
    const handleEditClick = (student) => {
        setEditingStudent(student);
        setActiveModal('student');
    };

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.id));
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} warden(s)?`)) {
            setWardens(wardens.filter(w => !selectedIds.includes(w.id)));
            setSelectedIds([]);
            setCurrentPage(1);
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-xs text-gray-400 mt-1">Manage all Students</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length === 1 && (
                        <button
                            onClick={() => {
                                const target = wardens.find(w => w.id === selectedIds[0]);
                                if (target) openEditWardenModal(target);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-danger rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search" />
                    </div>
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm"><Download className="w-4 h-4" /> Export</button>
                    <button onClick={() => setActiveModal('student')} className="flex items-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm">
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className=" text-[#222222] text-xs font-semibold border-b border-gray-50">
                            <th className="p-4 text-gray-300"><button onClick={handleSelectAll}>{selectedIds.length === students.length ? <CheckSquare className=" h-5 w-5 text-[#0A437A]" /> : <Square className="h-5 w-5 text-gray-300" />}</button></th>
                            {['Admission No', 'Name', 'Course', 'Department', 'Org Id', 'Hostel', 'Status', 'Action'].map(h => <th key={h} className="p-4">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {students.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="p-4"><button onClick={() => handleSelectRow(s.id)}>{selectedIds.includes(s.id) ? <CheckSquare className=" h-5 w-5 text-[#0A437A]" /> : <Square className="h-5 w-5 text-gray-300" />}</button></td>
                                <td className="p-4">{s.admissionNo}</td>
                                <td className="p-4 flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-[10px]">NM</div>{s.name}</td>
                                <td className="p-4">{s.course}</td>
                                <td className="p-4">{s.dept}</td>
                                <td className="p-4">{s.orgId}</td>
                                <td className="p-4"><select className="border-none bg-transparent"><option>{s.hostel}</option></select></td>
                                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs ${s.status === 'Active' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>{s.status}</span></td>
                                <td className="p-4 flex gap-3 text-secondary"><Trash2 className="w-4 h-4" />
                                    <Pencil
                                        className="w-4 h-4 cursor-pointer text-secondary"
                                        onClick={() => handleEditClick(s)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {activeModal === 'student' && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form
                        className="
            bg-white
            rounded-2xl
            w-full
            max-w-4xl
            max-h-[90vh]
            overflow-y-auto max-h-[calc(100vh-160px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            p-8
            shadow-2xl
            animate-in
            fade-in
            zoom-in-95
            duration-200
        "
                    >    {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                                <p className="text-xs text-gray-400 mt-1">Fill in the details to manually create a new Student</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal(false)}
                                className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Basic Info */}
                            <section>
                                <h3 className="text-[14px] font-medium text-primary  ">Basic Info</h3>
                                <h5 className='text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 '>Basic contact information of the student</h5>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className="block text-xs mb-1.5 font-medium">Admission No *</label><input required className="w-full p-2.5 border border-gray-200 rounded-lg text-xs" placeholder="Enter the student id" /></div>
                                    <div><label className="block text-xs mb-1.5 font-medium">Full Name *</label><input required className="w-full p-2.5 border border-gray-200 rounded-lg text-xs" placeholder="Enter your full name" /></div>
                                    <div><label className="block text-xs mb-1.5 font-medium">Gender *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select gender</option></select></div>
                                    <div><label className="block text-xs mb-1.5 font-medium">Date Of Birth *</label><input type="date" className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400" /></div>
                                </div>
                            </section>

                            {/* Academic Information */}
                            <section>
                                <h3 className="text-[14px] font-medium text-primary ">Academic Information</h3>
                                <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">Academic  information of the student</h5>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className="block text-xs mb-1.5 font-medium">Organization *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select</option></select></div>
                                    <div><label className="block text-xs mb-1.5 font-medium">Course *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select</option></select></div>
                                    <div><label className="block text-xs mb-1.5 font-medium">Department *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select</option></select></div>
                                    <div><label className="block text-xs mb-1.5 font-medium">Academic Year *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select</option></select></div>
                                    <div className="col-span-2"><label className="block text-xs mb-1.5 font-medium">Assign Hostel *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select an Hostel</option></select></div>
                                </div>
                            </section>

                            {/* Contact & Address */}
                            <section className="w-full">
                                <div className='w-full'>
                                    <h3 className="text-[14px] font-medium text-primary">Contact Information</h3>
                                    <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">Contact  information of the student</h5>
                                    <div className='flex w-full justify-between gap-6'>
                                        <div className="col-span-2 w-[50%]">
                                            <label className="block text-xs font-medium text-black mb-1">Phone Number *</label>
                                            <div className="flex border border-gray-200 rounded-lg overflow-hidden ">
                                                <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black">
                                                    <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                                    +91
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="00000 00000"
                                                    className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 w-[50%]">
                                            <label className="block text-xs font-medium text-black mb-1">Email Address *</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="Enter the email"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </section>

                            <section>
                                <h3 className="text-[14px] font-medium text-primary">Address Information</h3>
                                <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 ">Address  information of the student</h5>
                                <label className="block text-xs mb-1.5 font-medium">Full Address *</label>
                                <textarea className="w-full p-2.5 border border-gray-200 rounded-lg text-xs h-[106px]" placeholder="text your address" />
                            </section>

                            {/* Parent Information */}
                            <section>
                                <h3 className="text-sm w-full font-medium text-primary mb-4 pb-2 border-b border-gray-200 ">Parent Information</h3>
                                <div className="grid grid-cols-2 w-full gap-6">
                                    <div><label className="block text-xs mb-1.5 font-medium text-black">Full Name *</label><input placeholder="Enter the name" className="w-full p-2.5 border border-gray-200 rounded-lg text-xs" /></div>
                                    <div><label className="block text-xs mb-1.5 font-medium text-black">Relation *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400"><option>Select</option></select></div>
                                </div>
                                <div className='flex w-full justify-between gap-6'>
                                    <div className="col-span-2 w-[50%]">
                                        <label className="block text-xs font-medium text-black mb-1">Phone Number *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden ">
                                            <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black">
                                                <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                                +91
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="00000 00000"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 w-[50%]">
                                        <label className="block text-xs font-medium text-black mb-1">Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter the email"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                        />
                                    </div>
                                </div>

                            </section>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
                            <button type="submit" className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium">Save</button>
                            <button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>

                        </div>
                    </form>
                </div>
            )}
            {activeModal === 'edit-student' && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                                </h2>
                            </div>
                        </div>

                        {/* Example of a controlled input field */}
                        <div>
                            <label className="block text-xs mb-1.5 font-medium">Full Name *</label>
                            <input
                                defaultValue={editingStudent?.name || ''}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                                placeholder="Enter your full name"
                            />
                        </div>


                        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
                            <button type="submit" className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs">
                                {editingStudent ? 'Save Changes' : 'Save'}
                            </button>
                            <button type="button" onClick={() => { setActiveModal(null); setEditingStudent(null); }} className="px-6 py-2 border border-gray-200 rounded-lg text-xs">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isFilterModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Filter Students</h2>
                            <button
                                type="button"
                                onClick={() => setIsFilterModalOpen(false)}
                                className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Course */}
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Course</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"><option>Select</option></select>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Department</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"><option>Select</option></select>
                            </div>

                            {/* Hostel */}
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Hostel</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"><option>Select</option></select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Status</label>
                                <div className="bg-green-50/50 w-30 border border-green-100 rounded-lg p-2.5 text-xs text-success flex justify-between items-center">
                                    <span>Active</span>
                                    <ChevronDown size={14} />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium">Reset</button>
                                <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium">Filter</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}