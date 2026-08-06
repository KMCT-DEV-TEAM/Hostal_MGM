import React from 'react';
import { User } from 'lucide-react';

const ProfileHeaderCard = ({ user, activeStudent, admissionNumber, course, batch, year }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-start gap-4 border-b border-gray-50 relative">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary text-xl font-bold shrink-0">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            user?.name ? user.name.substring(0, 2).toUpperCase() : 'ST'
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-text-primary truncate">{user?.name || user?.parentName || 'No value'}</h2>
                        {user?.isActive !== false && (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-success border border-green-200 text-[10px] font-bold uppercase tracking-wide">
                                Active
                            </span>
                        )}
                    </div>
                    {user?.role === 'parent' ? (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                            <User className="w-3.5 h-3.5" />
                            <span>{activeStudent?.name || 'No value'}</span>
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
    );
};

export default ProfileHeaderCard;
