import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Droplet, Lightbulb, Wifi, Wrench, AlertCircle } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

const WardenComplaintsMobileList = ({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    onViewClick,
    ...rest
}) => {
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

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

    return (
        <MobileList
            {...rest}
            items={complaints}
            loading={loading}
            emptyText="No complaints found."
            iconFn={(complaint) => (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryBgColor(complaint.category)}`}>
                    {getCategoryIcon(complaint.category)}
                </div>
            )}
            titleFn={(complaint) => `${complaint.subject} - ${complaint.roomNo}`}
            subtitleFn={(complaint) => `${complaint.student} • ${complaint.description || complaint.category}`}
            rightTopFn={(complaint) => complaint.date}
            statusBadgeFn={(complaint) => {
                let dotColor = 'bg-blue-500', bgColor = 'bg-blue-50', textColor = 'text-blue-600';
                if (complaint.status === 'Resolved') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
                else if (complaint.status === 'Awaiting' || complaint.status === 'Pending') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
                else if (complaint.status === 'Rejected') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
                else if (complaint.status === 'Incomplete') { dotColor = 'bg-primary'; bgColor = 'bg-primary/10'; textColor = 'text-primary'; }

                return (
                    <MobileCardStatusBadge
                        status={complaint.status || 'Pending'}
                        dotColorClass={dotColor}
                        bgColorClass={bgColor}
                        textColorClass={textColor}
                    />
                );
            }}
            onViewDetails={(complaint) => onViewClick && onViewClick(complaint)}
            renderBody={(complaint) => (
                <>
                    <MobileRow label="Room No" value={complaint.roomNo} />
                    <MobileRow label="Date" value={complaint.date} />
                    <MobileRow label="Status" value={
                        <span className={`inline-flex items-center justify-center w-24 px-4 py-0.5 text-[11px] font-medium rounded-md border ${
                            complaint.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' :
                            complaint.status === 'Awaiting' ? 'bg-warning/10 text-warning border-warning/20' :
                            complaint.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                            complaint.status === 'Incomplete' ? 'bg-primary/10 text-primary border-primary/20' :
                            complaint.status === 'Rejected' ? 'bg-red-50 text-danger border-red-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                            {complaint.status || 'Pending'}
                        </span>
                    } />
                    <MobileRow label="Category" value={
                        <div onClick={(e) => e.stopPropagation()} className="w-full">
                            <Dropdown
                                minWidth=""
                                options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                value={complaint.categoryId || complaint.category}
                                onChange={(val) => handleCategoryChange && handleCategoryChange(complaint.id, val)}
                                triggerClassName="w-full px-2 py-1 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                            />
                        </div>
                    } />
                    <MobileRow label="Priority" value={
                        <div onClick={(e) => e.stopPropagation()} className="w-full">
                            <Dropdown
                                minWidth=""
                                options={[
                                    { value: "High", label: "High" },
                                    { value: "Medium", label: "Medium" },
                                    { value: "Low", label: "Low" }
                                ]}
                                value={complaint.priority || 'Medium'}
                                onChange={(val) => handlePriorityChange && handlePriorityChange(complaint.id, val)}
                                triggerClassName={`w-full px-2 py-1 text-xs font-regular text-start rounded-lg transition-colors cursor-pointer border ${complaint.priority === 'High' ? 'bg-danger/10 text-danger hover:bg-danger/20 border-danger/20' : complaint.priority === 'Medium' ? 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}`}
                            />
                        </div>
                    } />
                </>
            )}
        />
    );
};

export default WardenComplaintsMobileList;
