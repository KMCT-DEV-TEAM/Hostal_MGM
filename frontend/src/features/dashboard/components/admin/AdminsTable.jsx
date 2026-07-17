import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  Pencil,
  Building2,
  Phone,
  SlidersHorizontal,
  MoreVertical,
  Plus,
  Download
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Dropdown from "@/components/ui/Dropdown";
import DataView from "@/components/ui/data-view/DataView";
import { useTranslation } from "@/hooks/useTranslation";

export default function AdminsTable({
  admins,
  organizations,
  loading,
  error,
  canCreate,
  canEdit,
  canDelete,
  searchValue = "",
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
  onViewClick,
  onEditClick,
  onStatusChangeClick,
  onOrganizationChange,
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

  const [searchTerm, setSearchTerm] = useState(searchValue);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    setSearchTerm(searchValue);
  }, [searchValue]);

  useEffect(() => {
    onSearch?.(debouncedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const getAdminId = (a) => a._id ?? a.id;

  // 1. Column Configuration
  const columns = [
    {
      key: "adminName",
      header: "Administrator Details",
      type: "user",
      truncate: true,
      titleAccessor: (a) => a.name,
      subtitleAccessor: (a) => a.email,
      avatarAccessor: (a) => a.name,
    },
    {
      key: "phone",
      header: "Phone",
      icon: Phone,
      accessor: (a) => a.phone || "-"
    },
    {
      key: "organization",
      header: "Organization",
      icon: Building2,
      renderCell: (a) => (
        <div className="relative w-full min-w-[150px]" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            minWidth=""
            options={(() => {
              const opts = organizations.map(org => ({ value: org._id, label: org.name }));
              if (a.organization && typeof a.organization === 'object') {
                if (!opts.find(opt => opt.value === a.organization._id)) {
                  opts.push({ value: a.organization._id, label: a.organization.name });
                }
              }
              return opts;
            })()}
            value={a.organization?._id || a.organization || ""}
            onChange={(val) => onOrganizationChange?.(a._id, val)}
            placeholder={t('select_organization')}
            triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-colors"
          />
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      accessor: (a) => ({
        text: Boolean(a.isActive) ? t("active") : t("inactive"),
        color: Boolean(a.isActive) ? "green" : "red"
      }),
      renderCell: (a) => {
        const isActive = Boolean(a.isActive);
        return (
          <div className="relative inline-block w-[105px]" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              minWidth=""
              options={[
                { value: "Active", label: t("active") },
                { value: "Inactive", label: t("inactive") },
              ]}
              value={isActive ? "Active" : "Inactive"}
              onChange={() => onStatusChangeClick?.(a._id, isActive ? "Inactive" : "Active")}
              triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
            />
          </div>
        );
      }
    },
    {
      key: "action",
      header: "Action",
      align: "center",
      renderCell: (a) => (
        <div className="flex gap-3 items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEditClick?.(a)}
            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit admin"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // 2. Card Configuration for ResponsiveList
  const cardConfig = {
    avatar: (a) => a.name?.split(' ').map(n => n[0]).join('').substring(0, 2),
    title: (a) => a.name || "-",
    subtitle: (a) => a.email || "-",
    status: (a) => ({
      text: Boolean(a.isActive) ? t("active") : t("inactive"),
      color: Boolean(a.isActive) ? "green" : "red"
    }),
    fields: [
      { icon: Phone, value: (a) => a.phone || "-" },
      { icon: Building2, value: (a) => typeof a.organization === 'object' ? a.organization?.name : a.organization || "-" }
    ]
  };

  // 3. Toolbar Configuration
  const addNewButton = canCreate && (
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
        placeholder="All Status"
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
      {(canEdit || canDelete) && (
        <div className="relative" ref={bulkMenuRef}>
          <button
            onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
            className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {isBulkMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
              {canEdit && (
                <button
                  onClick={() => { setIsBulkMenuOpen(false); onActivateSelected?.(); }}
                  disabled={selectedIds.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Active {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => { setIsBulkMenuOpen(false); onDeactivateSelected?.(); }}
                  disabled={selectedIds.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Inactive {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <DataView
      addButton={addNewButton}
      pageScrollMode={true}
      data={admins}
      columns={columns}
      cardConfig={cardConfig}
      loading={loading}
      error={error}
      searchQuery={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      searchPlaceholder="Search Admins..."
      canSelect={true}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      onSelectRow={onSelectRow}
      onRowClick={onViewClick}
      toolbarStartSlot={toolbarStartSlot}
      toolbarEndSlot={toolbarEndSlot}
      page={page}
      setPage={setPage}
      limit={limit}
      setLimit={setLimit}
      totalItems={totalItems}
      totalPages={totalPages}
      emptyText="No records found matching your search criteria."
      className="h-full border-none shadow-none"
    />
  );
}
