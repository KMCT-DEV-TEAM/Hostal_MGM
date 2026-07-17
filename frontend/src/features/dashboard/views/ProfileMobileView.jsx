import React from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { User, Users, GraduationCap, Building2, Settings, Globe, LogOut, Phone, Mail, FileText, Pencil } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateReadable } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

const ProfileMobileView = ({
    user,
    handleEditClick,
}) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    useLayoutConfig({
        header: {
            variant: "page",
            title: "Profile",
            showBack: true
        },
        footer: {
            visible: true
        }
    });

    const admissionNumber = user?.studentId || 'No value';
    const course = user?.courseId?.name || 'No value';
    const batch = user?.batchId?.name || 'No value';
    const year = user?.academicYear || 'No value';
    const organization = user?.organizationId?.name || 'No value';
    const contactEmail = user?.email || 'No value';
    const contactNumber = user?.phone || 'No value';
    const hostel = user?.hostelId?.name || 'No value';
    const block = user?.hostelId?.block || 'No value';
    const room = user?.roomNumber || 'No value';
    const checkInDate = user?.joiningDate ? formatDateReadable(user.joiningDate) : 'No value';
    const warden = 'No value';

    return (
        <div className="w-full min-h-full bg-background-secondary p-4 flex flex-col gap-4">

            {/* Top Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-start gap-4 border-b border-gray-50 relative">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary text-xl font-bold flex-shrink-0">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                user?.name ? user.name.substring(0, 2).toUpperCase() : 'ST'
                            )}
                        </div>
                        {/* Edit profile picture icon (decorative for now, or you can add a handler later) */}
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <Pencil className="w-2.5 h-2.5" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-lg font-bold text-text-primary truncate">{user?.name || 'No value'}</h2>
                            {user?.isActive !== false && (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-success border border-green-200 text-[10px] font-bold uppercase tracking-wide">
                                    Active
                                </span>
                            )}
                        </div>
                        {user?.role === 'parent' ? (
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                                <User className="w-3.5 h-3.5" />
                                <span>{user?.studentId?.name || 'No value'}</span>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 mt-0.5">{admissionNumber}</p>
                        )}
                    </div>
                </div>

                {user?.role !== 'parent' && (
                    <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-center text-xs font-medium text-text-secondary gap-2">
                        <span>{course}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>Batch {batch}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{year}</span>
                    </div>
                )}
            </div>

            {user?.role === 'parent' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-text-primary text-sm">Basic Informations</h3>
                    </div>

                    <div className="p-4 flex flex-col gap-5">
                        <div className="flex items-start gap-3">
                            <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Student</p>
                                <p className="text-sm font-medium text-text-primary">{user?.studentId?.name || 'No value'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contact Email</p>
                                <p className="text-sm font-medium text-text-primary">{contactEmail}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contact Number</p>
                                    <p className="text-sm font-medium text-text-primary">{contactNumber}</p>
                                </div>
                                <button
                                    onClick={() => handleEditClick('phone', user?.phone)}
                                    className="p-2 text-primary hover:bg-blue-50 rounded-lg active:scale-95 transition-all"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Relation</p>
                                <p className="text-sm font-medium text-text-primary">Parent</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Visitors Button */}
                    <button
                        onClick={() => navigate('/dashboard/visitors')}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:scale-[0.99] transition-transform w-full"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50/50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-text-primary text-sm">Visitors</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </button>

                    {/* Academic Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-text-primary text-sm">Academic Details</h3>
                        </div>

                        <div className="p-4 flex flex-col gap-5">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Admission Number</p>
                                    <p className="text-sm font-medium text-text-primary">{admissionNumber}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Organization</p>
                                    <p className="text-sm font-medium text-text-primary">{organization}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contact Email</p>
                                    <p className="text-sm font-medium text-text-primary">{contactEmail}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contact Number</p>
                                        <p className="text-sm font-medium text-text-primary">{contactNumber}</p>
                                    </div>
                                    <button
                                        onClick={() => handleEditClick('phone', user?.phone)}
                                        className="p-2 text-primary hover:bg-blue-50 rounded-lg active:scale-95 transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hostel Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-text-primary text-sm">Hostel Details</h3>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Hostel</p>
                                    <p className="text-sm font-semibold text-text-primary truncate">{hostel}</p>
                                </div>
                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Block</p>
                                    <p className="text-sm font-semibold text-text-primary truncate">{block}</p>
                                </div>
                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Room</p>
                                    <p className="text-sm font-semibold text-text-primary truncate">{room}</p>
                                </div>
                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                                    <p className="text-sm font-semibold text-text-primary truncate">{checkInDate}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Warden</p>
                                        <p className="text-sm font-semibold text-text-primary">{warden}</p>
                                    </div>
                                </div>
                                <button className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                                    <Phone className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-text-secondary" />
                    </div>
                    <h3 className="font-semibold text-text-primary text-sm">Account settings</h3>
                </div>

                <div className="flex flex-col">
                    <button className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-text-primary">Language</p>
                                <p className="text-[10px] font-medium text-gray-400 mt-0.5">English (US)</p>
                            </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>

                    <button
                        onClick={() => logout()}
                        className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-4 h-4 text-danger" />
                            <p className="text-sm font-semibold text-danger">Logout</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ProfileMobileView;
