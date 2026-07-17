import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import {
    Pencil,
    Mail,
    Phone,
    MapPin,
    Users,
    MoreVertical,
    Plus,
    Download
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Dropdown from "@/components/ui/Dropdown";
import DataView from "@/components/ui/data-view/DataView";
import { useTranslation } from "@/hooks/useTranslation";

export default function OrganizationTable({
    orgs,
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
    setSelectedOrganizationDetail,
    setView,
    openModal,
    handleStatusChangeClick,
    isAdmin,
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
            key: "orgName",
            header: t("name"),
            type: "user",
            truncate: true,
            titleAccessor: (o) => o.name,
            subtitleAccessor: (o) => "",
            avatarAccessor: (o) => o.name,
        },
        {
            key: "email",
            header: t("email"),
            icon: Mail,
            accessor: (o) => o.email || "-"
        },
        {
            key: "phone",
            header: t("phone"),
            icon: Phone,
            accessor: (o) => o.phone || "-"
        },
        {
            key: "address",
            header: t("address"),
            icon: MapPin,
            accessor: (o) => o.address || "-"
        },
        {
            key: "students",
            header: "Students",
            align: "center",
            icon: Users,
            accessor: (o) => o.studentsCount || 0
        },
        {
            key: "status",
            header: t("status"),
            align: "center",
            accessor: (o) => ({
                text: Boolean(o.isActive) ? t("active") : t("inactive"),
                color: Boolean(o.isActive) ? "green" : "red"
            }),
            renderCell: (o) => {
                const isActive = Boolean(o.isActive);
                if (isAdmin) {
                    return (
                        <div className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-regular border rounded-md ${isActive ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-danger border-red-200'}`}>
                            {isActive ? "Active" : "Inactive"}
                        </div>
                    );
                }
                return (
                    <div className="relative inline-block w-[105px]" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: t("active") },
                                { value: "Inactive", label: t("inactive") },
                            ]}
                            value={isActive ? "Active" : "Inactive"}
                            onChange={() => handleStatusChangeClick?.(o._id, isActive)}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                        />
                    </div>
                );
            }
        },
        ...(isAdmin ? [] : [
            {
                key: "action",
                header: t("action"),
                align: "center",
                renderCell: (o) => (
                    <div className="flex gap-3 items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => openModal?.('edit', o)}
                            className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit organization"
                        >
                            <Pencil className="w-4 h-4 text-secondary" />
                        </button>
                    </div>
                )
            }
        ])
    ];

    // 2. Card Configuration for ResponsiveList
    const cardConfig = {
        avatar: (o) => o.name?.split(' ').map(n => n[0]).join('').substring(0, 2),
        title: (o) => o.name || "-",
        subtitle: (o) => o.email || "-",
        status: (o) => ({
            text: Boolean(o.isActive) ? t("active") : t("inactive"),
            color: Boolean(o.isActive) ? "green" : "red"
        }),
        fields: [
            { label: t("phone"), value: (o) => o.phone || "-" },
            { label: t("address"), value: (o) => o.address || "-" },
            { label: "Students", value: (o) => o.studentsCount || 0 }
        ],
        onStatusChange: isAdmin ? undefined : (o, isActive) => handleStatusChangeClick?.(o._id, o.isActive),
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

    const toolbarEndSlot = !isAdmin && (
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
            data={orgs}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            error={error}
            searchPlaceholder="Search Organization..."
            searchQuery={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            toolbarStartSlot={toolbarStartSlot}
            toolbarEndSlot={toolbarEndSlot}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            canSelect={!isAdmin}
            emptyText={t('no_org_found')}
            onRowClick={(o) => {
                setSelectedOrganizationDetail?.(o);
                setView?.('detail');
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
}

