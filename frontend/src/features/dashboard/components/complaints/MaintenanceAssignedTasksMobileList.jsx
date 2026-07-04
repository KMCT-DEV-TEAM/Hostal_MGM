import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';

const MaintenanceAssignedTasksMobileList = ({
    tasks,
    loading,
    handleResolveClick,
    handleRejectClick,
    getStatusStyle
}) => {

    const renderBody = (task) => (
        <>
            <MobileRow label="Room" value={task.roomNo} />
            <MobileRow label="Category" value={task.category?.name || 'N/A'} />
            <MobileRow label="Assigned On" value={new Date(task.createdAt).toLocaleDateString()} />
            <MobileRow 
                label="Status" 
                value={
                    <span className={`inline-flex items-center justify-center w-[105px] px-3 py-1 text-xs font-medium rounded-md border-none ${getStatusStyle(task.status)}`}>
                        {task.status || 'Pending'}
                    </span>
                } 
            />
            {task.status === 'In progress' && (
                <MobileRow 
                    label="Action" 
                    value={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleResolveClick(task); }}
                                className="px-3 py-1.5 bg-[#0A437A] text-white rounded text-xs font-medium hover:bg-primary-200 transition-colors cursor-pointer"
                            >
                                Resolve
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRejectClick(task); }}
                                className="px-3 py-1.5 bg-danger-100 text-danger-700 rounded text-xs font-medium hover:bg-danger-200 transition-colors cursor-pointer"
                            >
                                Reject
                            </button>
                        </div>
                    } 
                />
            )}
        </>
    );

    return (
        <MobileList
            items={tasks}
            loading={loading}
            canSelect={false}
            canEdit={false}
            emptyText="No tasks found."
            titleFn={(task) => task.subject || 'Task'}
            renderBody={renderBody}
        />
    );
};

export default MaintenanceAssignedTasksMobileList;
