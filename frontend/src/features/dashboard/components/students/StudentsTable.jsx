import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  Pencil,
  Building2,
  Home,
  SlidersHorizontal,
  MoreVertical,
  Plus,
  Download
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Dropdown from "@/components/ui/Dropdown";
import DataView from "@/components/ui/data-view/DataView";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";

export default function StudentsTable({
  students,
  loading,
  error,
  canCreate,
  canEdit,
  canDelete,
  searchValue = "",
  onSearch,
  onFilterClick,
  onExport,
  onAddClick,
  onActivateSelected,
  onDeactivateSelected,
  showOrganizationColumn = false,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onViewClick,
  onEditClick,
  onStatusChange,
  statusLoadingIds = [],
  // Pagination
  page,
  setPage,
  limit,
  setLimit,
  totalItems,
  totalPages,
}) {
  const role = useAuthStore((state) => state.user?.role);
  const canManage = canEdit && (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN);
  const showActionsColumn = canManage;
  const getStudentId = (s) => s._id ?? s.id;
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState(searchValue);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));

  useEffect(() => {
    setSearchTerm(searchValue);
  }, [searchValue]);

  useEffect(() => {
    onSearch?.(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const getHostelName = (hostel) => {
    if (!hostel || typeof hostel !== "object") return hostel || "-";
    return hostel.name ?? hostel.hostelName ?? "-";
  };

  const getOrganizationName = (organization, organizationId) => {
    if (!organization || typeof organization !== "object") return organizationId || "-";
    return organization.name ?? "-";
  };

  const getInitials = (name = "") => name.trim().substring(0, 2).toUpperCase() || "NA";

  // 1. Column Configuration (No UI building outside of extremely custom cells)
  const columns = [
    {
      key: "studentName",
      header: "Student Details",
      // Complex cell needing avatar rendering
      renderCell: (s) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
          onClick={() => onViewClick?.(s)}
        >
          <div className="w-8 h-8 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {getInitials(s.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors truncate max-w-[150px]" title={s.name}>
              {s.name || "-"}
            </span>
            <span className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]" title={s.studentId}>
              {s.studentId || "-"}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "course",
      header: "Course",
      accessor: (s) => s.course?.name || s.course || "-"
    },
    {
      key: "department",
      header: "Department",
      accessor: (s) => s.department?.name || s.department || "-",
      icon: Building2,
    },
    ...(showOrganizationColumn ? [{
      key: "organization",
      header: "Organization",
      icon: Building2,
      accessor: (s) => getOrganizationName(s.organization, s.organizationId),
    }] : []),
    {
      key: "hostel",
      header: "Hostel",
      icon: Home,
      accessor: (s) => getHostelName(s.hostel),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      accessor: (s) => ({
        text: Boolean(s.isActive) ? t("active") : t("inactive"),
        color: Boolean(s.isActive) ? "green" : "red"
      }),
      renderCell: (s) => {
        const isActive = Boolean(s.isActive);
        const studentId = getStudentId(s);

        return canManage ? (
          <div className="relative inline-block w-[105px]" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              minWidth=""
              options={[
                { value: "Active", label: t("active") },
                { value: "Inactive", label: t("inactive") },
              ]}
              value={isActive ? "Active" : "Inactive"}
              onChange={() => onStatusChange?.(studentId)}
              triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
            />
          </div>
        ) : (
          <div className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-regular border rounded-md ${isActive ? "bg-green-50 text-success border-green-200" : "bg-red-50 text-danger border-red-200"}`}>
            {isActive ? t("active") : t("inactive")}
          </div>
        )
      }
    },
    ...(showActionsColumn ? [{
      key: "action",
      header: "Action",
      align: "center",
      renderCell: (s) => (
        <div className="flex gap-3 items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {canManage && (
            <button
              onClick={() => !statusLoadingIds.includes(getStudentId(s)) && onEditClick?.(s)}
              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Edit student"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  // 2. Card Configuration for ResponsiveList
  const cardConfig = {
    avatar: (s) => getInitials(s.name),
    title: (s) => s.name || "-",
    subtitle: (s) => s.studentId || "-",
    status: (s) => ({
      text: Boolean(s.isActive) ? t("active") : t("inactive"),
      color: Boolean(s.isActive) ? "green" : "red"
    }),
    fields: columns.filter(c => c.accessor && c.icon),
    onEdit: canManage ? onEditClick : undefined
  };

  // 3. Toolbar Configuration
  const toolbarStartSlot = null;

  const toolbarEndSlot = (
    <>
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      )}
      {(canEdit || canDelete) && (
        <Dropdown
          options={[
            ...(canEdit ? [{
              value: "active",
              label: `Active ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`,
              disabled: selectedIds.length === 0
            }] : []),
            ...(canDelete ? [{
              value: "inactive",
              label: `Inactive ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`,
              disabled: selectedIds.length === 0
            }] : [])
          ]}
          value={null}
          placeholder="Bulk Actions"
          onChange={(val) => {
            if (val === "active") onActivateSelected?.();
            if (val === "inactive") onDeactivateSelected?.();
          }}
          minWidth="w-[140px]"
          triggerClassName="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
        />
      )}
      {canCreate && (
        <button
          onClick={onAddClick}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-xl text-sm font-medium hover:bg-[#0A437A]/90 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      )}
    </>
  );

  return (
    <DataView
      data={students}
      columns={columns}
      cardConfig={cardConfig}
      loading={loading}
      error={error}
      searchQuery={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      searchPlaceholder="Search Students..."
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
