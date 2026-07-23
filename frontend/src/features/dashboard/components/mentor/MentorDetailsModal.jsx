import React from 'react';
import Modal from '@/components/ui/Modal';
import { Mail, Phone, Building, GraduationCap, Calendar, ShieldCheck, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

export default function MentorDetailsModal({
    mentor,
    onClose,
    onEdit
}) {
    const role = useAuthStore(s => s.user?.role);

    if (!mentor) return null;

    const isActive = mentor.isActive === true || mentor.isActive === 'true';

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Mentor Details"
            subtitle="Detailed view of the mentor's profile"
            maxWidth="max-w-2xl"
            bottomSheetOnMobile={true}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            onEdit(mentor);
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Edit Details
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold shrink-0">
                        {mentor.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 truncate">{mentor.name}</h3>
                                <p className="text-sm text-gray-500 font-medium">ID: {mentor._id}</p>
                            </div>
                            <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-100 bg-white">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 mb-0.5">Email Address</p>
                                    <p className="font-medium text-gray-900 truncate">{mentor.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 mb-0.5">Phone Number</p>
                                    <p className="font-medium text-gray-900 truncate">{mentor.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-white">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Professional Details</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 mb-0.5">Specialization</p>
                                    <p className="font-medium text-gray-900 truncate">{mentor.specialization || "Not Specified"}</p>
                                </div>
                            </div>

                            {role === ROLES.SUPER_ADMIN && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 mb-0.5">Organization</p>
                                        <p className="font-medium text-gray-900 truncate">{mentor.organization?.name || "Unassigned"}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
