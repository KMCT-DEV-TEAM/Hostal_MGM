import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Pencil } from 'lucide-react';
import ChangeEmailModal from '../students/ChangeEmailModal';
import { useAuthStore } from '@/store/useAuthStore';
import { changeParentEmail } from '@/services/parent.service';
import InfoRow from '@/components/ui/InfoRow';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';

export default function ParentDetailsModal({ parent, onClose, onUpdate }) {
    const role = useAuthStore((s) => s.user?.role);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const handleEmailChange = async ({ oldEmail, newEmail, otp }) => {
        if (!role) throw new Error("Role not found");
        if (oldEmail !== parent.email) {
            throw new Error("Current email does not match");
        }

        const parentId = parent.id || parent.id || parent.parentId;
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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Basic Info */}
                    <DetailCard title="Basic Info" subtitle="Basic contact information of the Parent">
                        <DetailRow label="Full Name" value={parent.parentName} />
                        <DetailRow label="Phone No" value={parent.phone} />
                        <DetailRow label="Email" value={
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
                        } />
                        <DetailRow label="Status" value={
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                {parent.isActive === true ? 'Active' : 'Inactive'}
                            </span>
                        } />
                    </DetailCard>

                    {/* Linked Student Info */}
                    <DetailCard title="Linked Student Information" subtitle="Information of the linked Student">
                        <DetailRow label="Full Name" value={parent.student.name} />
                        <DetailRow label="Assigned Hostel" value="Kmct Engineering Hostel" />
                        <DetailRow label="Email" value={typeof parent.student === 'object' ? parent.student?.email || 'N/A' : 'student@gmail.com'} />
                        <DetailRow label="Full Address" value="Abc street, saojini nagar india" />
                    </DetailCard>
                </div>

                {/* Right Summary Sidebar */}
                <div className='lg:col-span-2 space-y-6'>
                    <DetailCard title="Parent Summary" className="h-fit">
                        <DetailRow label="Full Name" value={parent.parentName} />
                        <DetailRow label="Relation" value={parent.relationship} />
                        <DetailRow label="Student Name" value={typeof parent.student === 'object' ? parent.student?.name : parent.student} />
                        <DetailRow label="Hostel" value="Kmct Engineering Hostel" />
                        <DetailRow label="Status" value={
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                {parent.isActive === true ? 'Active' : 'Inactive'}
                            </span>
                        } />
                    </DetailCard>
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
