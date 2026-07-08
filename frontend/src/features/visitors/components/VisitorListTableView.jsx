import React, { useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Filter, Download, Check, X, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Dropdown from '@/components/ui/Dropdown';

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
    page,
    setPage,
    pagination
}) => {

    const headers = useMemo(() => {
        const baseCols = ["Visitor Name", "Visiting Student", "Organization", "Phone", "Relation", { label: "Status", align: "start" }];
        if (canApproveReject) {
            baseCols.push({ label: "Actions", align: "center" });
        }
        return baseCols;
    }, [canApproveReject]);

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
                <td className="p-4 text-text-secondary font-medium">{visitingStudentNames}</td>
                <td className="p-4 text-text-secondary font-medium">{organization}</td>
                <td className="p-4 text-text-secondary font-medium">{phone}</td>
                <td className="p-4 text-text-secondary font-medium capitalize">{relation}</td>
                <td className="p-4">
                    <StatusBadge status={visitor.status} />
                </td>
                {canApproveReject && (
                    <td className="p-4 text-center">
                        {visitor.status?.toLowerCase() === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    fullWidth={false}
                                    onClick={() => onApprove(visitor.visitorId || visitor.id || visitor._id)}
                                    className="!p-1.5 bg-success/10 text-success hover:bg-success/20 hover:text-success"
                                    title="Approve"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    fullWidth={false}
                                    onClick={() => onReject(visitor.visitorId || visitor.id || visitor._id)}
                                    className="!p-1.5 bg-danger/10 text-danger hover:bg-danger/20 hover:text-danger"
                                    title="Reject"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <span className="text-gray-400 text-sm">--</span>
                        )}
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
                toolbarActions={
                    <>
                        <Dropdown
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Approved', label: 'Approved' },
                                { value: 'Rejected', label: 'Rejected' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => onStatusFilterChange(val)}
                            placeholder="Filter Status"
                            minWidth="min-w-[140px]"
                            triggerClassName="px-3 py-2 text-sm bg-white border-gray-200 focus:border-secondary h-10"
                        />
                        {canExport && (
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth={false}
                                onClick={onExportClick}
                                className="flex-1 sm:flex-none whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        )}
                        {canRegister && (
                            <Button
                                size="md"
                                fullWidth={false}
                                onClick={onRegisterClick}
                                className="flex-1 sm:flex-none whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                Register
                            </Button>
                        )}
                    </>
                }
                renderRow={renderRow}
                emptyText="No visitors found."
                page={page}
                setPage={setPage}
                limit={10}
                totalPages={pagination?.totalPages || 1}
                totalItems={pagination?.totalItems || 0}
            />
        </div>
    );
};

export default VisitorListTableView;
