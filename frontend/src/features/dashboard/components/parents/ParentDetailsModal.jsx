import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Pencil } from 'lucide-react';
import ChangeEmailModal from '../students/ChangeEmailModal';
import { useAuthStore } from '@/store/useAuthStore';
import { changeParentEmail } from '@/services/parent.service';
import InfoRow from '@/components/ui/InfoRow';

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
        <Modal bottomSheetOnMobile={true} isOpen={true}
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
                        <div className="space-y-1">
                            <InfoRow label="Full Name">{parent.parentName}</InfoRow>
                            <InfoRow label="Phone No">{parent.phone}</InfoRow>
                            <InfoRow label="Email">
                                <div className="flex items-center justify-between w-full">
                                    <span>{parent.email}</span>
                                    {
                                        role !== "mentor" && <button
                                            type="button"
                                            className="ml-2 p-1 rounded text-text-secondary hover:text-primary transition cursor-pointer"
                                            onClick={() => setIsEmailModalOpen(true)}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    }
                                </div>
                            </InfoRow>
                            <InfoRow label="Status">
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                    {parent.isActive === true ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                        </div>
                    </div>

                    {/* Linked Student Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-primary mb-1">Linked Student Information</h3>
                        <p className="text-xs text-gray-400 mb-6">Information of the linked Student</p>
                        <div className="space-y-1">
                            <InfoRow label="Full Name">{parent.student.name}</InfoRow>
                            <InfoRow label="Assigned Hostel">Kmct Engineering Hostel</InfoRow>
                            <InfoRow label="Email">{typeof parent.student === 'object' ? parent.student?.email || 'N/A' : 'student@gmail.com'}</InfoRow>
                            <InfoRow label="Full Address">Abc street, saojini nagar india</InfoRow>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-lg font-semibold text-primary mb-4">Parent Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label="Full Name">{parent.parentName}</InfoRow>
                        <InfoRow label="Relation">{parent.relationship}</InfoRow>
                        <InfoRow label="Student Name">{typeof parent.student === 'object' ? parent.student?.name : parent.student}</InfoRow>
                        <InfoRow label="Hostel">Kmct Engineering Hostel</InfoRow>
                        <InfoRow label="Status">
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                {parent.isActive === true ? 'Active' : 'Inactive'}
                            </span>
                        </InfoRow>
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
