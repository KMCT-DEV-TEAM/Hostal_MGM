import React from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

export default function ConfirmStudentModal({
    isOpen,
    onClose,
    student,
    onConfirm,
    isSubmitting
}) {
    if (!student) return null;

    const initials = student.name ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
    console.log(student)
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Student Details"
            subtitle="Verify the student's information before marking attendance."
            maxWidth="max-w-sm"
        >
            <div className="flex flex-col items-center mt-6">
                {student.profileImage ? (
                    <img
                        src={student.profileImage}
                        alt={student.name}
                        className="w-24 h-24 rounded-full object-cover shadow-sm mb-4 border border-gray-100"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-50/50 flex items-center justify-center mb-4">
                        <span className="text-[#0A437A] font-medium text-3xl">{initials}</span>
                    </div>
                )}

                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-8">Room No : {student.roomNo || 'N/A'}</p>

                <div className="flex w-full gap-4 justify-center">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                        Reject
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md bg-green-50 text-green-600 border border-green-200 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Approve
                    </button>
                </div>
            </div>
        </Modal>
    );
}
