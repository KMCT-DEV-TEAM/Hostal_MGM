import React, { useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Edit, } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import InfoCard from '@/components/ui/InfoCard';

const VisitorListTableView = ({
    visitors,
    loading,
    searchQuery,
    onSearch,
    statusFilter,
    onStatusFilterChange,
    canApproveReject,
    canExport,
    onExportClick,
    canRegister = false,
    onRegisterClick,
    onApprove,
    onReject,
    onRowClick,
    page,
    setPage,
    pagination,
    userRole,
    onEdit,
    onDelete
}) => {

    const headers = useMemo(() => {
        const baseCols = ["Visitor Name"];

        if (userRole !== 'student') {
            baseCols.push("Visiting Student");
        }
        if (['super_admin', 'admin', 'warden'].includes(userRole)) {
            baseCols.push("Room No");
        }

        if (['warden', 'super_admin'].includes(userRole)) {
            baseCols.push("Organization");
        } else if (['admin', 'parent'].includes(userRole)) {
            baseCols.push("Hostel");
        }

        baseCols.push("Phone", "Relation", { label: "Status", align: "start" });

        if (userRole === 'parent') {
            baseCols.push({ label: "Actions", align: "center" });
        }
        return baseCols;
    }, [userRole]);

    const renderRow = (visitor) => {
        const visitingStudentNames = visitor.students && visitor.students.length > 0
            ? visitor.students.map(s => s.name || s).join(', ')
            : '--';

        const visitorName = visitor.visitorName || visitor.name || 'Unknown';
        const organization = visitor.organizationName || '--';
        const relation = visitor.relationship || visitor.relation || '--';
        const phone = visitor.phone || '--';

        return (
            <>
                <td className="p-4 flex items-center gap-3 font-bold text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                        {visitorName.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold">{visitorName}</span>
                </td>

                {userRole !== 'student' && (
                    <td className="p-4 text-text-secondary font-medium">{visitingStudentNames}</td>
                )}

                {['super_admin', 'admin', 'warden'].includes(userRole) && (
                    <td className="p-4 text-text-secondary font-medium">{visitor.roomNumber || '--'}</td>
                )}

                {['warden', 'super_admin'].includes(userRole) && (
                    <td className="p-4 text-text-secondary font-medium">{organization}</td>
                )}
                {['admin', 'parent'].includes(userRole) && (
                    <td className="p-4 text-text-secondary font-medium">{visitor.hostelName || '--'}</td>
                )}

                <td className="p-4 text-text-secondary font-medium">{phone}</td>
                <td className="p-4 text-text-secondary font-medium capitalize">{relation}</td>
                <td className="p-4">
                    <StatusBadge status={visitor.status} />
                </td>
                {userRole === 'parent' && (
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                fullWidth={false}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit && onEdit(visitor);
                                }}
                                className="!p-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20"
                                title="Edit"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                        </div>
                    </td>
                )}
            </>
        );
    };

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-white md:bg-transparent rounded-xl md:rounded-none relative">
            <DataTable
                headers={headers}
                items={visitors}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={(e) => onSearch(e.target.value)}
                searchPlaceholder="Search visitors..."
                filterOptions={[
                    { value: '', label: 'All Status' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Rejected', label: 'Rejected' }
                ]}
                filterValue={statusFilter}
                onFilterChange={onStatusFilterChange}
                filterPlaceholder="Filter Status"
                onExport={canExport ? onExportClick : undefined}
                onAdd={canRegister ? onRegisterClick : undefined}
                addText="Register"
                renderRow={renderRow}
                renderMobileItem={(visitor) => {
                    const visitorName = visitor.visitorName || visitor.name || 'Unknown';
                    const relation = visitor.relationship || visitor.relation || '--';
                    const visitingStudentNames = visitor.students && visitor.students.length > 0 ? visitor.students.map(s => s.name || s).join(', ') : '--';
                    return (
                        <div className="mb-2">
                            <InfoCard
                                avatar={visitorName}
                                title={visitorName}
                                subtitle={relation}
                                status={{
                                    text: visitor.status || 'Unknown',
                                    color: ['Checked_in', 'Approved', 'Completed'].includes(visitor.status) ? "green"
                                        : ['Checked_out', 'Rejected', 'Overstayed'].includes(visitor.status) ? "red"
                                            : ['Extended', 'Pending'].includes(visitor.status) ? "yellow"
                                                : "gray"
                                }}
                                fields={[
                                    { label: "Phone", value: visitor.phone || '--' },
                                    userRole !== 'student' && { label: "Student", value: visitingStudentNames },
                                    ['super_admin', 'admin', 'warden'].includes(userRole) && { label: "Room", value: visitor.roomNumber || '--' },
                                ].filter(Boolean)}
                                onClick={() => onRowClick && onRowClick(visitor)}
                                editable={userRole === 'parent'}
                                onEdit={() => onEdit && onEdit(visitor)}
                            />
                        </div>
                    );
                }}
                emptyText="No visitors found."
                page={page}
                setPage={setPage}
                limit={10}
                totalPages={pagination?.totalPages || 1}
                totalItems={pagination?.totalItems || 0}
                onRowClick={onRowClick}
            />
        </div>
    );
};

export default VisitorListTableView;
