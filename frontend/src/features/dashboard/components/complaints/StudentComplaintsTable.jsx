import React from 'react';
import {
    Pencil,
    Tag,
    Home,
    Info,
    Calendar,
    Grid,
    FileText
} from "lucide-react";
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';

export default function StudentComplaintsTable({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    openEditModal,
    onViewDetail,
    searchValue,
    onSearchChange,
    addButton,
    toolbarStartSlot,
    toolbarEndSlot,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalItems
}) {
    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name
    }));

    const columns = [
        {
            key: "category",
            header: "Category",
            icon: Tag,
            renderCell: (o) => (
                <div className="relative w-full max-w-[120px]" onClick={e => e.stopPropagation()}>
                    {o.status === 'Pending' ? (
                        <Dropdown
                            minWidth=""
                            options={categoryOptions.length > 0 ? categoryOptions : [{ value: o.categoryId || o.category, label: o.category }]}
                            value={o.categoryId || o.category}
                            onChange={(val) => handleCategoryChange(o.id, val)}
                            triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-text-primary hover:border-gray-300 transition-colors cursor-pointer"
                        />
                    ) : (
                        <span className="px-3 py-1.5 text-xs font-regular text-text-secondary bg-gray-50 border border-gray-200 rounded-lg inline-block w-full">
                            {o.category}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: "roomNo",
            header: "Room No",
            icon: Home,
            accessor: (o) => o.roomNo || "N/A"
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
            key: "status",
            header: "Status",
            align: "center",
            renderCell: (o) => (
                <span className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md border ${o.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' :
                        o.status === 'Awaiting' ? 'bg-warning/10 text-warning border-warning/20' :
                            o.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                o.status === 'Incomplete' ? 'bg-primary/10 text-primary border-primary/20' :
                                    o.status === 'Rejected' ? 'bg-red-50 text-danger border-red-200' :
                                        'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                    {o.status || 'Pending'}
                </span>
            )
        },
        {
            key: "action",
            header: "Action",
            align: "center",
            renderCell: (o) => (
                <div className="flex items-center justify-center gap-3 text-gray-400" onClick={e => e.stopPropagation()}>
                    {o.status === 'Pending' ? (
                        <button
                            onClick={() => openEditModal && openEditModal(o)}
                            className="text-secondary cursor-pointer transition-colors hover:text-blue-600"
                            title="Edit complaint"
                        >
                            <Pencil className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                        </button>
                    ) : (
                        <Pencil className="w-4 h-4 mx-auto opacity-30 cursor-not-allowed" strokeWidth={1.5} title="Cannot edit non-pending complaints" />
                    )}
                </div>
            )
        }
    ];

    const cardConfig = {
        avatar: (o) => o.subject?.substring(0, 2)?.toUpperCase() || "NA",
        title: (o) => o.subject || "-",
        subtitle: (o) => o.category || "-",
        status: (o) => {
            let dotColor = 'bg-blue-500', bgColor = 'bg-blue-50', textColor = 'text-blue-600';
            if (o.status === 'Resolved') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
            else if (o.status === 'Awaiting') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
            else if (o.status === 'Pending') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
            else if (o.status === 'Incomplete') { dotColor = 'bg-purple-500'; bgColor = 'bg-purple-50'; textColor = 'text-purple-600'; }
            else if (o.status === 'Rejected') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
            return {
                label: o.status || 'Pending',
                dotClass: dotColor,
                bgClass: bgColor,
                textClass: textColor,
                className: 'w-[105px] justify-center'
            };
        },
        fields: [
            { label: "Room No", icon: Grid, value: (o) => o.roomNo || "N/A" },
            { label: "Date", icon: Calendar, value: (o) => o.date || "-" }
        ]
    };

    return (
        <DataView
            addButton={addButton}
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
            onRowClick={(o) => onViewDetail && onViewDetail(o)}
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
