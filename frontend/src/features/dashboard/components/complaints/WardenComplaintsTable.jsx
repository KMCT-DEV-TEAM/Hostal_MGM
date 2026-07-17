import React from 'react';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';
import {
    User,
    Home,
    Tag,
    Calendar,
    AlertCircle,
    Info,
    Grid,
    Flag,
    FileText
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

export default function WardenComplaintsTable({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    onViewClick,
    isViewOnly = false,
    searchValue,
    onSearchChange,
    toolbarStartSlot,
    toolbarEndSlot,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalItems
}) {
    const { t } = useTranslation();

    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

    const columns = [
        {
            key: "student",
            header: "Student",
            type: "user",
            truncate: true,
            titleAccessor: (o) => o.student,
            subtitleAccessor: (o) => "",
            avatarAccessor: (o) => o.student,
        },
        {
            key: "roomNo",
            header: "Room No",
            icon: Home,
            accessor: (o) => o.roomNo || "N/A"
        },
        {
            key: "category",
            header: "Category",
            icon: Tag,
            renderCell: (o) => (
                <div className="relative w-full max-w-[140px]" onClick={e => e.stopPropagation()}>
                    <Dropdown
                        minWidth=""
                        options={categoryOptions.length > 0 ? categoryOptions : [{ value: o.categoryId || o.category, label: o.category }]}
                        value={o.categoryId || o.category}
                        onChange={(val) => handleCategoryChange && handleCategoryChange(o.id, val)}
                        triggerClassName="px-3 py-1.5 text-xs font-medium text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer w-full flex justify-between items-center"
                    />
                </div>
            )
        },
        {
            key: "subject",
            header: "Subject",
            icon: Info,
            truncate: true,
            accessor: (o) => o.subject
        },
        {
            key: "date",
            header: "Date",
            icon: Calendar,
            accessor: (o) => o.date
        },
        {
            key: "priority",
            header: "Priority",
            icon: AlertCircle,
            renderCell: (o) => (
                <div className="relative w-full max-w-[120px]" onClick={e => e.stopPropagation()}>
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "High", label: "High" },
                            { value: "Medium", label: "Medium" },
                            { value: "Low", label: "Low" }
                        ]}
                        value={o.priority || 'Medium'}
                        onChange={(val) => handlePriorityChange && handlePriorityChange(o.id, val)}
                        triggerClassName={`px-3 py-1.5 text-xs font-medium text-start rounded-md transition-colors cursor-pointer border ${o.priority === 'High' ? 'bg-danger/10 text-danger hover:bg-danger/20 border-danger/20' : o.priority === 'Medium' ? 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20' : 'bg-gray-100 text-text-secondary hover:bg-gray-200 border-gray-200'}`}
                    />
                </div>
            )
        },
        {
            key: "status",
            header: "Status",
            align: "center",
            renderCell: (o) => (
                <div onClick={e => e.stopPropagation()} className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md border ${
                    o.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' :
                    o.status === 'Awaiting' ? 'bg-warning/10 text-warning border-warning/20' :
                    o.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                    o.status === 'Incomplete' ? 'bg-primary/10 text-primary border-primary/20' :
                    o.status === 'Rejected' ? 'bg-red-50 text-danger border-red-200' :
                    'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                    {o.status || 'Pending'}
                </div>
            )
        }
    ];

    const cardConfig = {
        avatar: (o) => o.student?.split(' ').map(n => n[0]).join('').substring(0, 2),
        title: (o) => o.student || "-",
        subtitle: (o) => o.subject,
        fields: [
            { icon: Grid, value: (o) => o.roomNo || "N/A" },
            { icon: Tag, value: (o) => o.category },
            { icon: Calendar, value: (o) => o.date },
            { icon: Flag, value: (o) => o.priority },
            { icon: FileText, value: (o) => o.status }
        ]
    };

    return (
        <DataView
            pageScrollMode={true}
            data={complaints}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            searchPlaceholder="Search complaints..."
            searchQuery={searchValue}
            onSearchChange={onSearchChange}
            toolbarStartSlot={toolbarStartSlot}
            toolbarEndSlot={toolbarEndSlot}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            totalItems={totalItems}
            totalPages={totalPages}
            emptyText="No complaints found"
            onRowClick={(o) => onViewClick && onViewClick(o)}
            pagination={{
                currentPage: page,
                totalPages: totalPages,
                onPageChange: setPage,
                limit: limit,
                onLimitChange: setLimit,
                totalItems: totalItems,
            }}
            mobilePagination={{
                hasMore: page < totalPages,
                onLoadMore: () => setPage?.(prev => prev + 1),
            }}
            getItemId={(o) => o.id}
        />
    );
}
