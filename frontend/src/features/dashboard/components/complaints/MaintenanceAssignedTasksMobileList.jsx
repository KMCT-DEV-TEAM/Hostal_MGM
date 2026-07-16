import React from 'react';
import MobileList, { MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Droplet, Lightbulb, Wifi, Wrench, AlertCircle, FileText, Clock, Home } from 'lucide-react';

const MaintenanceAssignedTasksMobileList = ({
    tasks,
    loading,
    handleResolveClick,
    handleRejectClick,
    getStatusStyle,
    onViewClick
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

    const renderItem = (task) => {
        let dotColor = 'bg-blue-500', bgColor = 'bg-blue-50', textColor = 'text-blue-600';
        if (task.status === 'Resolved') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
        else if (task.status === 'Pending' || task.status === 'Awaiting') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
        else if (task.status === 'Rejected') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }

        return (
            <div 
                className="bg-white p-4 rounded-xl shadow-sm flex flex-col relative border border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => onViewClick && onViewClick(task)}
            >
                <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryBgColor(task.category)}`}>
                            {getCategoryIcon(task.category)}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-primary text-base mb-1 truncate">
                            {task.subject || 'Unknown Task'}
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{task.category || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <Home className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[150px]">Room: {task.roomNo || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{task.date}</span>
                    </div>
                    <MobileCardStatusBadge
                        status={task.status || 'Pending'}
                        dotColorClass={dotColor}
                        bgColorClass={bgColor}
                        textColorClass={textColor}
                    />
                </div>

                {task.status === 'In progress' && (
                    <div className="flex items-center w-full gap-3 mt-4 pt-4 border-t border-gray-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleResolveClick(task); }}
                            className="flex-1 py-2.5 bg-[#0A437A] text-white rounded-lg text-sm font-semibold hover:bg-primary-200 transition-colors cursor-pointer text-center"
                        >
                            Resolve
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleRejectClick(task); }}
                            className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer text-center"
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <MobileList
            items={tasks}
            loading={loading}
            emptyText="No tasks found."
            renderItem={renderItem}
        />
    );
};

export default MaintenanceAssignedTasksMobileList;
