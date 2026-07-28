import React from 'react';
import Modal from '@/components/ui/Modal';
import { User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const StudentSelectionModal = ({ students, onSelect }) => {
    const { logout } = useAuthStore();
    return (
        <Modal 
            isOpen={true} 
            onClose={() => {}} // User cannot close this modal without selecting
            title="Select Student" 
            size="md"
        >
            <div className="p-4 flex flex-col gap-3">
                <p className="text-sm text-gray-500 mb-2">Please select which student's dashboard you would like to view.</p>
                {students.map(student => (
                    <button
                        key={student._id}
                        onClick={() => onSelect(student._id)}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#0A437A] hover:bg-blue-50/50 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                            {student.profileImage ? (
                                <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-400 group-hover:text-[#0A437A]" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-[#0A437A]">{student.name}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">ID: {student.studentId || 'N/A'}</p>
                        </div>
                    </button>
                ))}
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                    <button 
                        onClick={() => logout()}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default StudentSelectionModal;
