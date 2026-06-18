import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';

export default function ParentFormModal({
    editingParent,
    onClose,
    onSave,
}) {
    const isEdit = !!editingParent;
    const role = useAuthStore((s) => s.user?.role);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (!isEdit && role) {
            setLoadingStudents(true);
            // Dynamically import to avoid circular dependencies if any
            import('@/services/student.service').then(({ getStudents }) => {
                getStudents(role, { limit: 1000 }).then(data => {
                    setStudents(data.students || []);
                }).catch(err => {
                    console.error("Failed to load students", err);
                }).finally(() => setLoadingStudents(false));
            });
        }
    }, [isEdit, role]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const payload = {
            parentName: formData.get('name'),
            phone: formData.get('phone'),
            relationship: formData.get('relation'),
        };

        if (!isEdit) {
            payload.email = formData.get('email');
            payload.studentId = formData.get('studentId');
        }

        onSave?.(payload);
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isEdit ? 'Edit Parent' : 'Add New Parent'}
            titleSize="text-lg"
            subtitle="Edit the details of parent"
            maxWidth="max-w-xl"
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary"
                    >
                        {isEdit ? 'Save Changes' : 'Save'}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-5">

                {/* Full Name */}
                <div className={isEdit ? 'col-span-2' : ''}>
                    <label className="block mb-1.5 text-xs font-medium">
                        Full Name *
                    </label>

                    <input
                        name="name"
                        required
                        defaultValue={editingParent?.name || editingParent?.parentName || ''}
                        placeholder="Enter full name"
                        className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                    />
                </div>

                {/* Email - Add only */}
                {!isEdit && (
                    <div>
                        <label className="block mb-1.5 text-xs font-medium">
                            Email Address *
                        </label>

                        <input
                            name="email"
                            type="email"
                            required
                            defaultValue={editingParent?.email || ''}
                            placeholder="Enter email address"
                            className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                        />
                    </div>
                )}

                {/* Phone */}
                <div>
                    <label className="block mb-1.5 text-xs font-medium">
                        Phone Number *
                    </label>

                    <div className="flex h-10 border border-gray-200 rounded-md overflow-hidden focus-within:border-secondary">
                        <div className="px-3 border-r border-gray-200 flex items-center gap-2 text-xs shrink-0">
                            <img
                                src="https://flagcdn.com/w20/in.png"
                                alt="India"
                                className="w-4 h-3"
                            />
                            +91
                        </div>

                        <input
                            name="phone"
                            type="text"
                            required
                            defaultValue={editingParent?.phone || ''}
                            placeholder="00000 00000"
                            className="flex-1 px-3 text-xs outline-none"
                        />
                    </div>
                </div>

                {/* Relation */}
                <div>
                    <label className="block mb-1.5 text-xs font-medium">
                        Relation *
                    </label>

                    <select
                        name="relation"
                        required
                        defaultValue={editingParent?.relation || editingParent?.relationship || ''}
                        className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                    >
                        <option value="">Select Relation</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                    </select>
                </div>

                {/* Student Selection - Add only */}
                {!isEdit && (
                    <div className="col-span-2">
                        <label className="block mb-1.5 text-xs font-medium">
                            Linked Student *
                        </label>

                        <select
                            name="studentId"
                            required
                            className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                            disabled={loadingStudents}
                        >
                            <option value="">
                                {loadingStudents ? "Loading students..." : "Select Student"}
                            </option>
                            {students.map(student => (
                                <option key={student._id || student.id} value={student._id || student.id}>
                                    {student.name} ({student.admissionNo})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

            </div>
        </Modal>
    );
}
