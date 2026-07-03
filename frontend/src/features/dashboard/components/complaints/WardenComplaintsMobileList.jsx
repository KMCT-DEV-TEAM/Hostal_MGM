import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';
import Dropdown from '@/components/ui/Dropdown';

const WardenComplaintsMobileList = ({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    onViewClick
}) => {
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

    return (
        <MobileList
            items={complaints}
            loading={loading}
            emptyText="No complaints found."
            titleFn={(complaint) => `${complaint.student} - ${complaint.subject}`}
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
