import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addParentSchema, editParentSchema } from '@/features/dashboard/validation/parentSchema';

export default function ParentFormModal({
    editingParent,
    onClose,
    onSave,
}) {
    const isEdit = !!editingParent;
    const role = useAuthStore((s) => s.user?.role);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Setup react-hook-form with Zod validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(isEdit ? editParentSchema : addParentSchema),
        defaultValues: {
            name: editingParent?.name || editingParent?.parentName || '',
            email: editingParent?.email || '',
            phone: editingParent?.phone || '',
            relation: editingParent?.relation || editingParent?.relationship || '',
            studentId: '',
        }
    });

    useEffect(() => {
        if (!isEdit && role) {
            setLoadingStudents(true);
            import('@/services/student.service').then(({ getStudents }) => {
                getStudents(role, { limit: 1000 }).then(data => {
                    setStudents(data.students || []);
                }).catch(err => {
                    console.error("Failed to load students", err);
                }).finally(() => setLoadingStudents(false));
            });
        }
    }, [isEdit, role]);

    const onSubmit = (data) => {
        const payload = {
            parentName: data.name,
            phone: data.phone,
            relationship: data.relation,
        };

        if (!isEdit) {
            payload.email = data.email;
            payload.studentId = data.studentId;
        }

        onSave?.(payload);
    };

    // Helper component for error messages
    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error.message}</p>;
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
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isEdit ? 'Save Changes' : 'Save'}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-5">

                {/* Full Name */}
                <div className={isEdit ? 'col-span-2' : ''}>
                    <label className="block mb-1.5 text-xs font-medium">
                        Full Name <span className="text-red-500">*</span>
                    </label>

                    <input
                        {...register("name")}
                        placeholder="Enter full name"
                        className={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors ${
                            errors.name ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-secondary'
                        }`}
                    />
                    <ErrorMessage error={errors.name} />
                </div>

                {/* Email - Add only */}
                {!isEdit && (
                    <div>
                        <label className="block mb-1.5 text-xs font-medium">
                            Email Address <span className="text-red-500">*</span>
                        </label>

                        <input
                            {...register("email")}
                            type="email"
                            placeholder="Enter email address"
                            className={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors ${
                                errors.email ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-secondary'
                            }`}
                        />
                        <ErrorMessage error={errors.email} />
                    </div>
                )}

                {/* Phone */}
                <div>
                    <label className="block mb-1.5 text-xs font-medium">
                        Phone Number <span className="text-red-500">*</span>
                    </label>

                    <div className={`flex h-10 border rounded-md overflow-hidden transition-colors ${
                        errors.phone ? 'border-red-300 focus-within:border-red-500 bg-red-50/30' : 'border-gray-200 focus-within:border-secondary'
                    }`}>
                        <div className={`px-3 border-r flex items-center gap-2 text-xs shrink-0 ${errors.phone ? 'border-red-200' : 'border-gray-200'}`}>
                            <img
                                src="https://flagcdn.com/w20/in.png"
                                alt="India"
                                className="w-4 h-3"
                            />
                            +91
                        </div>

                        <input
                            {...register("phone")}
                            type="text"
                            maxLength={10}
                            placeholder="0000000000"
                            className="flex-1 px-3 text-xs outline-none bg-transparent"
                        />
                    </div>
                    <ErrorMessage error={errors.phone} />
                </div>

                {/* Relation */}
                <div>
                    <label className="block mb-1.5 text-xs font-medium">
                        Relation <span className="text-red-500">*</span>
                    </label>

                    <select
                        {...register("relation")}
                        className={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors cursor-pointer bg-white ${
                            errors.relation ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-secondary'
                        }`}
                    >
                        <option value="">Select Relation</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                    </select>
                    <ErrorMessage error={errors.relation} />
                </div>

                {/* Student Selection - Add only */}
                {!isEdit && (
                    <div className="col-span-2">
                        <label className="block mb-1.5 text-xs font-medium">
                            Linked Student <span className="text-red-500">*</span>
                        </label>

                        <select
                            {...register("studentId")}
                            className={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors cursor-pointer bg-white ${
                                errors.studentId ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-secondary'
                            }`}
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
                        <ErrorMessage error={errors.studentId} />
                    </div>
                )}

            </div>
        </Modal>
    );
}
