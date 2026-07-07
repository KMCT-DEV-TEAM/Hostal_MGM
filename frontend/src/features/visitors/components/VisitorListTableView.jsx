import React, { useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Filter, Download, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';

const StatusBadge = ({ status }) => {
    if (!status) return <span className="text-gray-400 font-semibold">-----</span>;

    const normalizedStatus = status.toLowerCase();
    let displayStatus = status;
    let bgClass = '';
    let textClass = '';
    let borderClass = 'border';

    if (normalizedStatus === 'approved') {
        displayStatus = 'Approved';
        bgClass = 'bg-success/10';
        textClass = 'text-success';
        borderClass = 'border-success/30';
    } else if (normalizedStatus === 'rejected') {
        displayStatus = 'Rejected';
        bgClass = 'bg-danger/10';
        textClass = 'text-danger';
        borderClass = 'border-danger/30';
    } else if (normalizedStatus === 'pending') {
        displayStatus = 'Pending';
        bgClass = 'bg-warning/10';
        textClass = 'text-warning';
        borderClass = 'border-warning/30';
    } else if (normalizedStatus === 'inactive') {
        displayStatus = 'Inactive';
        bgClass = 'bg-gray-100';
        textClass = 'text-gray-600';
        borderClass = 'border-gray-200';
    } else {
        bgClass = 'bg-primary/10';
        textClass = 'text-primary';
        borderClass = 'border-primary/30';
    }

    return (
        <span className={`px-3 py-1.5 rounded-md text-xs border inline-flex items-center justify-center gap-1.5 min-w-[100px] ${bgClass} ${textClass} ${borderClass}`}>
            {displayStatus}
        </span>
    );
};

const VisitorListTableView = ({
    visitors,
    loading,
    searchQuery,
    onSearch,
    onFilterClick,
    onExportClick,
    hasActiveFilters,
    canApproveReject,
    onApprove,
    onReject
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
                        <Button
                            variant={hasActiveFilters ? "primary" : "outline"}
                            size="icon"
                            fullWidth={false}
                            onClick={onFilterClick}
                            className="!p-3 shrink-0"
                            title="Filter visitors"
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
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
                    </>
                }
                renderRow={renderRow}
                emptyText="No visitors found."
            />
        </div>
    );
};

export default VisitorListTableView;
