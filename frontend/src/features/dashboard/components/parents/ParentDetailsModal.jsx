import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Pencil } from 'lucide-react';
import ChangeEmailModal from '../students/ChangeEmailModal';
import { useAuthStore } from '@/store/useAuthStore';
import { changeParentEmail } from '@/services/parent.service';

export default function ParentDetailsModal({ parent, onClose, onUpdate }) {
    const role = useAuthStore((s) => s.user?.role);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const handleEmailChange = async ({ oldEmail, newEmail, otp }) => {
        if (!role) throw new Error("Role not found");
        if (oldEmail !== parent.email) {
            throw new Error("Current email does not match");
        }

        const parentId = parent._id || parent.id || parent.parentId;
        await changeParentEmail(role, parentId, {
            oldEmail,
            newEmail,
            otp
        });

        // Optimistically update the parent data
        onUpdate?.({ ...parent, email: newEmail });
    };

    if (!parent) return null;
    console.log("parent object:", parent.status);

    return (
        <Modal isOpen={true}
            avatar={parent.parentName}
            title={parent.parentName}
            subtitle={`Parent - ${parent.student?.name}`}
            onClose={onClose}
            maxWidth="max-w-5xl"
        >

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                        <p className="text-xs text-gray-400 mb-6">Basic contact information of the Parent</p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Full Name</span> <span className="col-span-2 font-medium text-gray-900">: {parent.parentName}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Phone No</span> <span className="col-span-2 font-medium text-gray-900">: {parent.phone}</span></div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-gray-500">Email</span>

                                <span className="col-span-2 font-medium text-gray-900 flex items-center justify-between">
                                    <span>: {parent.email}</span>

                                    <button
                                        type="button"
                                        className="ml-2 p-1 rounded hover:bg-gray-100 transition"
                                        onClick={() => setIsEmailModalOpen(true)}
                                    >
                                        <Pencil size={16} className="text-gray-500" />
                                    </button>
                                </span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className="col-span-2 font-medium text-gray-900 flex items-center">:
                                    <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mx-2`}></span>
                                    {parent.isActive === true ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Linked Student Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-primary mb-1">Linked Student Information</h3>
                        <p className="text-xs text-gray-400 mb-6">Information of the linked Student</p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Full Name</span> <span className="col-span-2 font-medium text-gray-900">: {parent.student.name}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Assigned Hostel</span> <span className="col-span-2 font-medium text-gray-900">: Kmct Engineering Hostel</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Email</span> <span className="col-span-2 font-medium text-gray-900">: {typeof parent.student === 'object' ? parent.student?.email || 'N/A' : 'student@gmail.com'}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Full Address</span> <span className="col-span-2 font-medium text-gray-900 leading-relaxed">: Abc street, saojini nagar india</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-lg font-semibold text-primary mb-4">Parent Summary</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Full Name</span> <span className="col-span-2 font-medium text-gray-900">: {parent.parentName}</span></div>
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Relation</span> <span className="col-span-2 font-medium text-gray-900">: {parent.relationship}</span></div>
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Student Name</span> <span className="col-span-2 font-medium text-gray-900">: {typeof parent.student === 'object' ? parent.student?.name : parent.student}</span></div>
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Hostel</span> <span className="col-span-2 font-medium text-gray-900">: Kmct Engineering Hostel</span></div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-text-secondary">Status</span>
                            <span className="col-span-2 font-medium text-gray-900 flex items-center">:
                                <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mx-2`}></span>
                                {parent.isActive === true ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <ChangeEmailModal
                isOpen={isEmailModalOpen}
                title="Change Email"
                subjectName={parent.parentName}
                currentEmail={parent.email}
                onClose={() => setIsEmailModalOpen(false)}
                onConfirmChange={handleEmailChange}
            />
        </Modal>
    );
}
