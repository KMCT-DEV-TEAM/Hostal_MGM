import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';

const AdminComplaintsMobileList = ({
    complaints,
    loading,
    onRowClick,
    showWarden = false
}) => {
    return (
        <MobileList
            items={complaints}
            loading={loading}
            emptyText="No records found."
            titleFn={(complaint) => `${complaint.organization} - ${complaint.hostel}`}
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
