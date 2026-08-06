import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQRModalStore } from '@/store/useQRModalStore';
import { MapPin, QrCode, Bell, User, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import { useParentStore } from '@/store/useParentStore';
import { ROLES } from '@/constants/roles';
import ClickOutsideHandler from '@/components/ui/ClickOutsideHandler';

const MobileDashboardHeader = () => {
    const { user } = useAuthStore();
    const { openModal } = useQRModalStore();
    const { unreadCount } = useNotifications();
    const { activeStudent } = useActiveStudent();
    const { setActiveStudent } = useParentStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const capitalizeWords = (str = "") =>
        str.replace(/\b\w/g, char => char.toUpperCase());

    const userName = capitalizeWords(user?.name || user?.parentName || "");
    const initials = userName.substring(0, 2).toUpperCase() || "ST";

    const hasMultipleStudents = user?.role === ROLES.PARENT && user?.students?.length > 1;

    return (
        <div className="pt-6 px-4 bg-linear-to-b from-background via-background/95 to-transparent pointer-events-none">
            <div className="bg-white rounded-[28px] p-2 flex items-center justify-between shadow-sm border border-gray-100 pointer-events-auto shadow-black/5">
                <Link to="/dashboard/profile" className="flex items-center gap-3 pl-1 hover:opacity-80 transition-opacity">
                    {user?.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={userName}
                            className="w-11 h-11 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                            {initials}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-text-primary leading-tight">
                            {userName}
                        </span>
                        <div className="flex items-center text-text-secondary gap-1 mt-0.5 relative">
                            {user?.role === ROLES.PARENT ? (
                                <div className="flex flex-col relative" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            if (hasMultipleStudents) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDropdownOpen(!dropdownOpen);
                                            }
                                        }}
                                        className={`flex items-center text-xs ${hasMultipleStudents ? 'hover:text-primary transition-colors cursor-pointer' : ''}`}
                                    >
                                        <span className="truncate max-w-37.5">
                                            {activeStudent?.name || 'No Student Selected'}
                                        </span>
                                        {hasMultipleStudents && (
                                            <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>

                                    {dropdownOpen && hasMultipleStudents && (
                                        <ClickOutsideHandler onClickOutside={() => setDropdownOpen(false)}>
                                            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-40 z-50">
                                                {user.students.map(student => (
                                                    <button
                                                        key={student._id}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveStudent(student._id);
                                                            setDropdownOpen(false);
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left"
                                                    >
                                                        <span className={`truncate ${activeStudent?._id === student._id ? 'text-primary font-medium' : 'text-gray-700'}`}>
                                                            {student.name}
                                                        </span>
                                                        {activeStudent?._id === student._id && (
                                                            <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </ClickOutsideHandler>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="text-xs">{user?.roomNumber || user?.room || 'Room No'}</span>
                                </>
                            )}
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-3 pr-3">
                    {user?.role === 'student' && (
                        <button
                            onClick={openModal}
                            className="text-text-secondary hover:text-gray-600 transition-colors cursor-pointer active:scale-95"
                        >
                            <QrCode className="w-5.5 h-5.5" strokeWidth={1.5} />
                        </button>
                    )}
                    <Link to="/dashboard/notifications" className="text-text-secondary hover:text-gray-600 relative transition-colors">
                        <Bell className="w-5.5 h-5.5" strokeWidth={1.5} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MobileDashboardHeader;
