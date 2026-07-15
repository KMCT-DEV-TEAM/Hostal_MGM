import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { BarChart3 } from 'lucide-react';

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
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
            )}
            titleFn={(complaint) => `${complaint.organization} - ${complaint.hostel}`}
            subtitleFn={(complaint) => `Total Complaints: ${complaint.totalComplaints}`}
            rightTopFn={(complaint) => complaint.pending > 0 ? `${complaint.pending} Pending` : null}
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
            renderBody={(complaint) => (
                <>
                    <MobileRow label="Total" value={<span className="text-[#0A437A] font-bold">{complaint.totalComplaints}</span>} />
                    {showWarden && <MobileRow label="Warden" value={complaint.warden} />}
                    <MobileRow label="Pending" value={<span className="text-yellow-600 font-medium">{complaint.pending}</span>} />
                    <MobileRow label="In Progress" value={<span className="text-blue-600 font-medium">{complaint.inProgress}</span>} />
                    <MobileRow label="Resolved" value={<span className="text-green-600 font-medium">{complaint.resolved}</span>} />
                </>
            )}
        />
    );
};

export default AdminComplaintsMobileList;
