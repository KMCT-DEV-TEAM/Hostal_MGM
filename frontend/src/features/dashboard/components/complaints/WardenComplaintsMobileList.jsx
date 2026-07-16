import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { FileText, Clock, Home } from 'lucide-react';

const WardenComplaintsMobileList = ({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    onViewClick,
    ...rest
}) => {
    return (
        <MobileList
            {...rest}
            items={complaints}
            loading={loading}
            emptyText="No complaints found."
            iconFn={(complaint) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {complaint.student ? complaint.student.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(complaint) => complaint.student || 'Unknown Student'}
            subtitleFn={(complaint) => (
                <>
                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[200px]">{complaint.subject || 'N/A'}</span>
                </>
            )}
            rightTopFn={(complaint) => (
                <>
                    <Home className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[150px]">Room: {complaint.roomNo || 'N/A'}</span>
                </>
            )}
            leftBottomFn={(complaint) => (
                <>
                    <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{complaint.date || 'N/A'}</span>
                </>
            )}
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
        />
    );
};

export default WardenComplaintsMobileList;
