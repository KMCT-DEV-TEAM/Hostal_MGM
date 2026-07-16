import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { BarChart3, FileText, AlertCircle } from 'lucide-react';

const AdminComplaintsMobileList = ({
    complaints,
    loading,
    onRowClick,
    showWarden = false,
    ...rest
}) => {
    return (
        <MobileList
            {...rest}
            items={complaints}
            loading={loading}
            emptyText="No records found."
            iconFn={() => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    <BarChart3 className="w-5 h-5 text-white" />
                </div>
            )}
            titleFn={(complaint) => `${complaint.organization} - ${complaint.hostel}`}
            subtitleFn={(complaint) => (
                <>
                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[150px]">Total: {complaint.totalComplaints}</span>
                </>
            )}
            rightTopFn={(complaint) => complaint.pending > 0 ? (
                <>
                    <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{complaint.pending} Pending</span>
                </>
            ) : null}
            statusBadgeFn={(complaint) => {
                const hasPending = complaint.pending > 0;
                return (
                    <MobileCardStatusBadge
                        status={hasPending ? "Needs Attention" : "All Clear"}
                        dotColorClass={hasPending ? 'bg-yellow-500' : 'bg-green-500'}
                        bgColorClass={hasPending ? 'bg-yellow-50' : 'bg-green-50'}
                        textColorClass={hasPending ? 'text-yellow-600' : 'text-green-600'}
                    />
                );
            }}
            onViewDetails={(complaint) => onRowClick && onRowClick(complaint)}

        />
    );
};

export default AdminComplaintsMobileList;
