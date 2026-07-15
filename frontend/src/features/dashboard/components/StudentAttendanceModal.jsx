import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import UpdateAttendanceModal from './UpdateAttendanceModal';
import StudentMonthlyCalendar from './StudentMonthlyCalendar';

export default function StudentAttendanceModal({ isOpen, onClose, student, windowId, onRecordUpdated }) {
    const { user } = useAuthStore();
    const [updateModalData, setUpdateModalData] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    if (!isOpen || !student) return null;

    const handleDayClick = ({ date, status }) => {
        setUpdateModalData({ date, status, windowId });
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
        >
            <div className="-mt-16 py-4"> {/* Negative margin to offset Modal's default padding/header spacing */}

                {/* Profile Section */}
                <div className="flex flex-row h-fit items-center mb-6">
                    {student.profileImage ? (
                        <img src={student.profileImage} alt="" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-50 text-primary flex items-center justify-center text-xl font-semibold shadow-sm border border-blue-100">
                            {student.name?.substring(0, 2).toUpperCase()}
                        </div>
                    )}

                    <div className="ml-4 flex flex-col items-start">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Room No : {student.room || 'N/A'}</p>
                    </div>
                </div>

                {/* Self-Fetching Calendar Component */}
                <StudentMonthlyCalendar 
                    student={student} 
                    userRole={user?.role} 
                    onDayClick={handleDayClick}
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {updateModalData && (
                <UpdateAttendanceModal
                    isOpen={!!updateModalData}
                    onClose={() => setUpdateModalData(null)}
                    student={student}
                    date={updateModalData.date}
                    currentStatus={updateModalData.status}
                    windowId={updateModalData.windowId}
                    onSuccess={() => {
                        setUpdateModalData(null);
                        setRefreshTrigger(prev => prev + 1);
                        if (onRecordUpdated) onRecordUpdated();
                    }}
                />
            )}
        </Modal>
    );
}
