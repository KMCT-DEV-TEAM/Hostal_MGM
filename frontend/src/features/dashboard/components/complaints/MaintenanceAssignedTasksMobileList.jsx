import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Droplet, Lightbulb, Wifi, Wrench, AlertCircle } from 'lucide-react';

const MaintenanceAssignedTasksMobileList = ({
    tasks,
    loading,
    handleResolveClick,
    handleRejectClick,
    getStatusStyle
}) => {

    const getCategoryIcon = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('water') || cat.includes('plumb')) return <Droplet className="w-5 h-5 text-blue-500" />;
        if (cat.includes('light') || cat.includes('electric')) return <Lightbulb className="w-5 h-5 text-orange-500" />;
        if (cat.includes('internet') || cat.includes('wifi') || cat.includes('network')) return <Wifi className="w-5 h-5 text-teal-500" />;
        if (cat.includes('clean') || cat.includes('housekeep') || cat.includes('maintain') || cat.includes('repair')) return <Wrench className="w-5 h-5 text-gray-500" />;
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    };

    const getCategoryBgColor = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('water') || cat.includes('plumb')) return "bg-blue-50";
        if (cat.includes('light') || cat.includes('electric')) return "bg-orange-50";
        if (cat.includes('internet') || cat.includes('wifi') || cat.includes('network')) return "bg-teal-50";
        if (cat.includes('clean') || cat.includes('housekeep') || cat.includes('maintain') || cat.includes('repair')) return "bg-gray-50";
        return "bg-red-50";
    };

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
            iconFn={(task) => (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryBgColor(task.category?.name)}`}>
                    {getCategoryIcon(task.category?.name)}
                </div>
            )}
            titleFn={(task) => task.subject || 'Task'}
            subtitleFn={(task) => task.roomNo ? `Room ${task.roomNo}` : (task.category?.name || 'N/A')}
            rightTopFn={(task) => new Date(task.createdAt).toLocaleDateString()}
            statusBadgeFn={(task) => {
                let dotColor = 'bg-blue-500', bgColor = 'bg-blue-50', textColor = 'text-blue-600';
                if (task.status === 'Resolved') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
                else if (task.status === 'Pending') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
                else if (task.status === 'Rejected') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
                return (
                    <MobileCardStatusBadge
                        status={task.status || 'Pending'}
                        dotColorClass={dotColor}
                        bgColorClass={bgColor}
                        textColorClass={textColor}
                    />
                );
            }}
            renderBody={renderBody}
        />
    );
};

export default MaintenanceAssignedTasksMobileList;
