import React from 'react';

export default function MaintenanceAssignedTasksHeader({ viewMode, setViewMode }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-4 w-full flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Assigned Tasks</h1>
                <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage your assigned maintenance tasks here.</p>
            </div>
            
            <div className="flex shrink-0 w-full sm:w-80">
                <div className="flex p-1 bg-gray-100/80 rounded-lg w-full border border-gray-200/50">
                    <button
                        onClick={() => setViewMode('tasks')}
                        className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'tasks' ? 'bg-white text-[#0A437A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'history' ? 'bg-white text-[#0A437A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History
                    </button>
                </div>
            </div>
        </div>
    );
}
