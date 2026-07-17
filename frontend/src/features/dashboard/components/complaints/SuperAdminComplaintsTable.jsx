import React from 'react';
import DataView from '@/components/ui/data-view/DataView';
import {
    Building2,
    Home,
    User,
    AlertTriangle,
    Clock,
    Loader2,
    CheckCircle,
    Building,
    Loader,
    FileText
} from "lucide-react";

export default function SuperAdminComplaintsTable({
    complaints,
    loading,
    onRowClick,
    showWarden = false,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalItems,
    searchQuery,
    onSearchChange
}) {
    const columns = [
        {
            key: "organization",
            header: "Organization",
            icon: Building2,
            accessor: (o) => o.organization || "N/A"
        },
        {
            key: "hostel",
            header: "Hostel",
            icon: Home,
            accessor: (o) => o.hostel || "N/A"
        },
        ...(showWarden ? [{
            key: "warden",
            header: "Warden",
            icon: User,
            accessor: (o) => o.warden || "N/A"
        }] : []),
        {
            key: "totalComplaints",
            header: "Total Complaints",
            align: "center",
            icon: AlertTriangle,
            accessor: (o) => o.totalComplaints || 0
        },
        {
            key: "pending",
            header: "Pending",
            align: "center",
            icon: Clock,
            accessor: (o) => o.pending || 0
        },
        {
            key: "inProgress",
            header: "In progress",
            align: "center",
            icon: Loader2,
            accessor: (o) => o.inProgress || 0
        },
        {
            key: "resolved",
            header: "Resolved",
            align: "center",
            icon: CheckCircle,
            accessor: (o) => o.resolved || 0
        }
    ];

    const cardConfig = {
        title: (o) => o.organization || "N/A",
        subtitle: (o) => o.hostel || "N/A",
        fields: [
            ...(showWarden ? [{ icon: FileText, value: (o) => o.warden || "N/A" }] : []),
            { label: "Total", value: (o) => o.totalComplaints || 0 },
            { label: "Pending", value: (o) => o.pending || 0 },
            { label: "In progress", value: (o) => o.inProgress || 0 },
            { label: "Resolved", value: (o) => o.resolved || 0 },
        ]
    };

    return (
        <DataView
            pageScrollMode={true}
            data={complaints}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            onRowClick={(o) => onRowClick && onRowClick(o)}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            totalItems={totalItems}
            totalPages={totalPages}
            emptyText="No records found"
            hideSearch={false}
            searchPlaceholder="Search complaints..."
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            hidePagination={!page}
            pagination={page ? {
                currentPage: page,
                totalPages: totalPages,
                onPageChange: setPage,
                limit: limit,
                onLimitChange: setLimit,
                totalItems: totalItems,
            } : undefined}
            mobilePagination={page ? {
                hasMore: page < totalPages,
                onLoadMore: () => setPage?.(prev => prev + 1),
            } : undefined}
            getItemId={(o) => o.id}
        />
    );
}
