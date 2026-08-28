import React from 'react';
import { GraduationCap, ChevronRight } from 'lucide-react';

const StudentSwitcherCard = ({ user, activeStudentId, setActiveStudent, setStudentToSwitch }) => {
    if (!user?.students || user.students.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4 p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-text-primary text-base">Students</h3>
                </div>
                <button className="text-xs text-primary font-medium hover:underline">View All</button>
            </div>

            <div className="flex flex-col gap-3">
                {user.students.map((student) => {
                    const isActive = student.id === activeStudentId;
                    return (
                        <button
                            key={student.id}
                            onClick={() => {
                                if (!isActive) {
                                    setStudentToSwitch(student);
                                }
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border ${isActive ? 'border-success' : 'border-gray-100'} active:scale-[0.99] transition-all text-left`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center shrink-0 text-primary text-sm font-bold">
                                        {student.profileImage ? (
                                            <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            student.name ? student.name.substring(0, 2).toUpperCase() : 'ST'
                                        )}
                                    </div>
                                    {isActive && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary text-[15px]">{student.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {student.room ? `Room ${student.room} • ` : ''}
                                        {student.currentYear ? `${student.currentYear} Year` : (student.course || student.studentId || 'Student')}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentSwitcherCard;
