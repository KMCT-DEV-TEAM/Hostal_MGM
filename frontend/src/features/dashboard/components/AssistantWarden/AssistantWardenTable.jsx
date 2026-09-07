import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import {
    Pencil,
    Mail,
    Phone,
    MoreVertical,
    Plus,
    Download,
    Building
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Dropdown from "@/components/ui/Dropdown";
import DataView from "@/components/ui/data-view/DataView";
import { useTranslation } from "@/hooks/useTranslation";

export default function AssistantWardenTable({
    assistantWardens,
    availableHostels,
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
    onSelectAll,
    onSelectRow,
    setSelectedAssistantWardenDetail,
    setView,
    openEditAssistantWardenModal,
    handleStatusChangeClick,
    handleHostelChange,
    // Pagination
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
}) {
    const { t } = useTranslation();

    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));

    const [searchTerm, setSearchTerm] = useState(searchValue || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    useEffect(() => {
        setSearchTerm(searchValue || "");
    }, [searchValue]);

    useEffect(() => {
        onSearch?.(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

    // 1. Column Configuration
    const columns = [
        {
            key: "assistantWardenName",
            header: t("name"),
            type: "user",
            truncate: true,
            titleAccessor: (w) => w.name,
            subtitleAccessor: (w) => "",
            avatarAccessor: (w) => w.name,
        },
        {
            key: "email",
            header: t("email"),
            icon: Mail,
            accessor: (w) => w.email || "-"
        },
        {
            key: "phone",
            header: t("phone"),
            icon: Phone,
            accessor: (w) => w.phone || "-"
        },
        {
            key: "hostel_name",
            header: t("hostel_name"),
            renderCell: (w) => (
                <div className="relative w-[145px]" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "Not Assigned", label: "Not Assigned" },
                            ...availableHostels.map(h => ({ value: h.id || h, label: h.name || h, disabled: !h.isActive }))
                        ]}
                        value={w.hostel?.id || w.hostel || 'Not Assigned'}
                        onChange={(val) => handleHostelChange?.(w.id, val)}
                        triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-colors"
                    />
                </div>
            )
        },
        {
            key: "status",
            header: t("status"),
            align: "center",
            accessor: (w) => ({
                text: Boolean(w.isActive) || w.status === 'Active' ? t("active") : t("inactive"),
                color: Boolean(w.isActive) || w.status === 'Active' ? "green" : "red"
            }),
            renderCell: (w) => {
                const isActive = Boolean(w.isActive) || w.status === 'Active';
                return (
                    <div className="relative inline-block w-[105px]" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: t("active") },
                                { value: "Inactive", label: t("inactive") },
                            ]}
                            value={isActive ? "Active" : "Inactive"}
                            onChange={(val) => {
                                if ((val === "Active" && !isActive) || (val === "Inactive" && isActive)) {
                                    handleStatusChangeClick?.(w.id, val);
                                }
                            }}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                        />
                    </div>
                );
            }
        },
        {
            key: "action",
            header: t("actions"),
            align: "center",
            renderCell: (w) => (
                <div className="flex gap-3 items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => openEditAssistantWardenModal?.(w)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit assistantWarden"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    // 2. Card Configuration for ResponsiveList
    const cardConfig = {
        avatar: (w) => w.name?.split(' ').map(n => n[0]).join('').substring(0, 2),
        title: (w) => w.name || "-",
        subtitle: (w) => w.email || "-",
        onEdit: openEditAssistantWardenModal,
        status: (w) => ({
            text: Boolean(w.isActive) || w.status === 'Active' ? t("active") : t("inactive"),
            color: Boolean(w.isActive) || w.status === 'Active' ? "green" : "red"
        }),
        fields: [
            { icon: Phone, value: (w) => w.phone || "-" },
            { icon: Building, value: (w) => w.hostel?.name || w.hostel || "Not Assigned" }
        ],
        onStatusChange: (w, isActive) => handleStatusChangeClick?.(w.id, w.status),
    };

    // 3. Toolbar Slots
    const addNewButton = onAddClick && (
        <button
            onClick={onAddClick}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#0A437A] text-white rounded-xl text-sm font-medium hover:bg-[#0A437A]/90 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New</span>
        </button>
    );

    const toolbarStartSlot = null;

    const toolbarEndSlot = (
        <>
            <Dropdown
                className="flex-1 sm:flex-none"
                options={[
                    { value: "All", label: "All Status" },
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" }
                ]}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder={"All Status"}
                minWidth="w-32"
                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer h-full"
            />
            {onExport && (
                <button
                    onClick={onExport}
                    className="flex items-center justify-center lg:gap-2 p-2 lg:px-4 lg:py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
                >
                    <Download className="w-4 h-4 text-gray-500 lg:text-inherit" />
                    <span className="hidden lg:inline">Export</span>
                </button>
            )}
            <div className="relative" ref={bulkMenuRef}>
                <button
                    onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                    className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
                >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {isBulkMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                        <button
                            onClick={() => { setIsBulkMenuOpen(false); onActivateSelected?.(); }}
                            disabled={selectedIds.length === 0}
                            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Active {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                        <button
                            onClick={() => { setIsBulkMenuOpen(false); onDeactivateSelected?.(); }}
                            disabled={selectedIds.length === 0}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Inactive {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <DataView
            addButton={addNewButton}
            pageScrollMode={true}
            data={assistantWardens}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            error={error}
            searchPlaceholder="Search AssistantWardens..."
            searchQuery={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            toolbarStartSlot={toolbarStartSlot}
            toolbarEndSlot={toolbarEndSlot}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelectRow={onSelectRow}
            canSelect={true}
            emptyText={t('no_records_found')}
            onRowClick={(assistantWarden) => {
                setSelectedAssistantWardenDetail?.(assistantWarden);
                setView?.('detail');
            }}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            totalItems={totalItems}
            totalPages={totalPages}
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
            getItemId={(w) => w.id}
        />
    );
}

