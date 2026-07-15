import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Droplet, Lightbulb, Wifi, Wrench, AlertCircle } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

const StudentComplaintsMobileList = ({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    openEditModal,
    onViewDetail,
    ...rest
}) => {
    // Transform categories into Dropdown options format
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
            subtitleFn={(complaint) => complaint.description || complaint.category}
            rightTopFn={(complaint) => complaint.date}
            statusBadgeFn={(complaint) => (
                <MobileCardStatusBadge
                    status={complaint.status}
                    dotColorClass={complaint.status === 'Resolved' ? 'bg-green-500' : complaint.status === 'In progress' ? 'bg-blue-500' : 'bg-yellow-500'}
                    bgColorClass={complaint.status === 'Resolved' ? 'bg-green-50' : complaint.status === 'In progress' ? 'bg-blue-50' : 'bg-yellow-50'}
                    textColorClass={complaint.status === 'Resolved' ? 'text-green-600' : complaint.status === 'In progress' ? 'text-blue-600' : 'text-yellow-600'}
                />
            )}
            onViewDetails={(complaint) => onViewDetail && onViewDetail(complaint)}
            canEdit={(complaint) => complaint.status === 'Pending'}
            onEdit={(complaint) => complaint.status === 'Pending' && openEditModal && openEditModal(complaint)}
            renderBody={(complaint) => (
                <>
                    <MobileRow label="Room" value={complaint.roomNo} />
                    <MobileRow label="Date" value={complaint.date} />
                    <MobileRow label="Status" value={
                        <span className={`inline-flex items-center justify-center w-24 px-4 py-0.5 text-[11px] font-medium rounded-md border ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : complaint.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' : complaint.status === 'In progress' ? 'bg-accent/10 text-blue-500 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {complaint.status}
                        </span>
                    } />
                    <MobileRow label="Category" value={
                        complaint.status === 'Pending' ? (
                            <div onClick={(e) => e.stopPropagation()} className="w-full">
                                <Dropdown
                                    minWidth=""
                                    options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                    value={complaint.categoryId || complaint.category}
                                    onChange={(val) => handleCategoryChange && handleCategoryChange(complaint.id, val)}
                                    triggerClassName="w-full px-2 py-1 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                />
                            </div>
                        ) : (
                            <div className="px-2 py-1 text-xs font-regular text-gray-500 bg-gray-50 border border-transparent rounded-lg inline-block w-full truncate">
                                {complaint.category}
                            </div>
                        )
                    } />
                </>
            )}
        />
    );
};

export default StudentComplaintsMobileList;
