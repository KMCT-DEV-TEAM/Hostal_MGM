import React from 'react';
import { Pencil, AlignLeft, Tag } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import DataView from '@/components/ui/data-view/DataView';
import { useTranslation } from '@/hooks/useTranslation';

const ComplaintCategoryTable = ({
    complaintCategories,
    loading,
    error,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedCategoryDetail,
    setView,
    handleStatusChangeClick,
    openModal,
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
}) => {
    const { t } = useTranslation();

    const columns = [
        {
            key: "name",
            header: "Category Name",
            type: "user",
            titleAccessor: (o) => o.name,
            subtitleAccessor: (o) => "",
            avatarAccessor: (o) => o.name?.substring(0, 2)?.toUpperCase() || "NA",
        },
        {
            key: "description",
            header: "Description",
            icon: AlignLeft,
            truncate: true,
            accessor: (o) => o.description || 'No description'
        },
        {
            key: "status",
            header: t('status'),
            renderCell: (o) => (
                <div className="relative inline-block w-[105px]" onClick={e => e.stopPropagation()}>
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" }
                        ]}
                        value={o.isActive ? "Active" : "Inactive"}
                        onChange={() => handleStatusChangeClick(o._id, o.isActive)}
                        triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${o.isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                    />
                </div>
            )
        },
        {
            key: "action",
            header: t('action'),
            align: "center",
            renderCell: (o) => (
                <div className="flex gap-3 items-center justify-center" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => openModal('edit', o)}
                        className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                        <Pencil className="w-4 h-4 text-secondary" />
                    </button>
                </div>
            )
        }
    ];

    const cardConfig = {
        avatar: (o) => o.name?.substring(0, 2)?.toUpperCase() || "NA",
        title: (o) => o.name,
        subtitle: (o) => o.description,
        fields: [
            { label: "Status", value: (o) => o.isActive ? "Active" : "Inactive" }
        ]
    };

    return (
        <DataView
            pageScrollMode={true}
            data={complaintCategories}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            error={error}
            searchPlaceholder="Search categories..."
            searchQuery={searchValue}
            onSearchChange={onSearchChange}
            toolbarStartSlot={toolbarStartSlot}
            toolbarEndSlot={toolbarEndSlot}
            emptyText={t('no_records_found')}
            onRowClick={(o) => {
                setSelectedCategoryDetail(o);
                setView('detail');
            }}
            selection={{
                selectedIds: selectedIds,
                onSelectAll: handleSelectAll,
                onSelectRow: handleSelectRow,
                getItemId: (o) => o._id
            }}
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
            getItemId={(o) => o._id}
        />
    );
};

export default ComplaintCategoryTable;

