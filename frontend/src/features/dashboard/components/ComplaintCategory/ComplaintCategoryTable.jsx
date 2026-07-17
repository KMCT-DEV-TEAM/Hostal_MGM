import React, { useState } from 'react';
import { Pencil, AlignLeft, Tag, Plus, Download, MoreVertical } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import DataView from '@/components/ui/data-view/DataView';
import { useTranslation } from '@/hooks/useTranslation';
import { useClickOutside } from '@/hooks/useClickOutside';

const ComplaintCategoryTable = ({
    complaintCategories,
    loading,
    error,
    searchValue,
    onSearch,
    statusFilter,
    onStatusFilterChange,
    onExport,
    onAddClick,
    onActivateSelected,
    onDeactivateSelected,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedCategoryDetail,
    setView,
    handleStatusChangeClick,
    openModal,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalItems
}) => {
    const { t } = useTranslation();
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));

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

    const toolbarStartSlot = (
        <Dropdown
            options={[
                { label: 'All Status', value: 'All' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
            ]}
            value={statusFilter}
            onChange={onStatusFilterChange}
            placeholder="Select Status"
            minWidth="w-32"
            triggerClassName="w-full sm:w-auto px-3 py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm cursor-pointer h-full"
        />
    );

    const toolbarEndSlot = (
        <>
            <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full whitespace-nowrap"
            >
                <Download className="w-4 h-4" /> Export
            </button>
            <div className="relative h-full" ref={bulkMenuRef}>
                <button
                    onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                    className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                {isBulkMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                        <button
                            onClick={() => { setIsBulkMenuOpen(false); onActivateSelected(); }}
                            disabled={selectedIds.length === 0}
                            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Active {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                        <button
                            onClick={() => { setIsBulkMenuOpen(false); onDeactivateSelected(); }}
                            disabled={selectedIds.length === 0}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Inactive {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                    </div>
                )}
            </div>
            <button
                onClick={onAddClick}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors shadow-sm cursor-pointer h-full whitespace-nowrap"
            >
                <Plus className="w-4 h-4" /> Add New
            </button>
        </>
    );

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
            onSearchChange={(e) => onSearch(e.target.value)}
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


