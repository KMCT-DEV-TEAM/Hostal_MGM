import React from 'react';
import { Users, Megaphone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ role }) => {
    const navigate = useNavigate();

    return (
        <>
            {role !== 'parent' && (
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
                        <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                </button>
            )}

            <button
                onClick={() => navigate('/dashboard/announcements')}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:scale-[0.99] transition-transform w-full mt-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50/50 flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="font-semibold text-text-primary text-sm">Announcements</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-primary" />
                </div>
            </button>
        </>
    );
};

export default QuickActions;
