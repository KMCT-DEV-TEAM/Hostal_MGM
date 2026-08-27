import React, { useState } from 'react';
import { User as UserIcon, LogOut, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { useParentStore } from '@/store/useParentStore';
import { useActiveStudent } from '@/hooks/useActiveStudent';

export default function ProfileDropdownMenu({ onClose, onLogout }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isSwitchMenuOpen, setIsSwitchMenuOpen] = useState(false);

    const { activeStudent } = useActiveStudent();
    const setActiveStudent = useParentStore(state => state.setActiveStudent);
    const isParent = user?.role === ROLES.PARENT;
    const hasMultipleStudents = user?.students?.length > 1;

    const getInitials = (name) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleSwitchStudent = (studentId) => {
        setActiveStudent(studentId);
        setIsSwitchMenuOpen(false);
    };

    return (
        <div className="absolute right-0 mt-5 flex gap-3 items-start z-50">
            {isSwitchMenuOpen && isParent && hasMultipleStudents && (
                <div className="w-85 mt-14 shrink-0 bg-white rounded-3xl shadow-sm border border-gray-100 py-4 animate-in slide-in-from-right-8 fade-in duration-200">
                    <div className="px-5 pb-2">
                        <p className="text-[10px] font-bold text-text-secondary mb-4">SWITCH STUDENT</p>

                        <div className="flex flex-col gap-2">
                            {user.students.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => handleSwitchStudent(student.id)}
                                    className={`w-full flex items-center justify-between transition-colors hover:bg-gray-50 p-2 -mx-2 rounded-xl text-left ${activeStudent?.id === student.id ? 'border border-success/20' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                                {student.profileImage ? (
                                                    <img src={student.profileImage} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-semibold text-primary">{getInitials(student.name)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-text-primary">{student.name}</p>
                                            <p className="text-[12px] font-medium text-text-secondary mt-0.5">
                                                {student.roomNo ? `Room ${student.roomNo}` : 'Unassigned'} • {student.year ? `${student.year} Year` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-85 shrink-0 bg-white rounded-3xl shadow-sm border border-gray-100 py-5 animate-in fade-in zoom-in-95 duration-200">
                {isParent && activeStudent && hasMultipleStudents && (
                    <div className="px-5 pb-5">
                        <p className="text-[10px] font-bold text-text-secondary mb-4">CURRENT STUDENT</p>
                        <div
                            onClick={() => hasMultipleStudents && setIsSwitchMenuOpen(!isSwitchMenuOpen)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border bg-white transition-colors ${hasMultipleStudents ? 'cursor-pointer group hover:bg-gray-50' : ''} ${isSwitchMenuOpen ? 'border-primary ring-2 ring-primary/10' : 'border-success/40'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                        {activeStudent.profileImage ? (
                                            <img src={activeStudent.profileImage} alt={activeStudent.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-semibold text-primary">{getInitials(activeStudent.name)}</span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-[2.5px] border-white rounded-full"></div>
                                </div>
                                <div className="text-left">
                                    <p className="text-[15px] font-bold text-text-primary">{activeStudent.name}</p>
                                    <p className="text-[12px] font-medium text-text-secondary mt-0.5">
                                        {activeStudent.roomNo ? `Room ${activeStudent.roomNo}` : 'Unassigned'} • {activeStudent.year ? `${activeStudent.year} Year` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            {hasMultipleStudents && (
                                <ChevronLeft size={18} className={`transition-transform duration-200 ${isSwitchMenuOpen ? 'rotate-180 text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            )}
                        </div>
                    </div>
                )}

                <div className="px-3">
                    <button
                        onClick={() => { onClose(); navigate('profile'); }}
                        className="w-full flex items-center gap-4 px-4 py-3 text-[15px] font-semibold text-text-secondary hover:text-primary hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                        <UserIcon size={20} className="text-inherit" strokeWidth={2.5} />
                        <span>My Profile</span>
                    </button>

                    <button
                        onClick={() => { onClose(); onLogout(); }}
                        className="w-full flex items-center gap-4 px-4 py-3 text-[15px] font-semibold text-danger hover:bg-red-50 rounded-2xl transition-colors mt-1"
                    >
                        <LogOut size={20} className="text-inherit" strokeWidth={2.5} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
