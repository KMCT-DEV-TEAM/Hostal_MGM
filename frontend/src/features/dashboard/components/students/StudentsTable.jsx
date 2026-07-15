import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  Pencil,
  Building2,
  Home,
  SlidersHorizontal,
  MoreVertical,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Dropdown from "@/components/ui/Dropdown";
import DataTable from "@/components/ui/DataTable";
import InfoCard from "@/components/ui/InfoCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";

const COLUMNS = [
  { key: "studentName", label: "Student Details" },
  { key: "course", label: "Course" },
  { key: "department", label: "Department" },
  { key: "organization", label: "Organization" },
  { key: "hostel", label: "Hostel" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action" },
];

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
}) {
  const role = useAuthStore((state) => state.user?.role);
  // Only Admin and Super Admin can edit a student or toggle status.
  const canManage =
    canEdit && (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN);

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
    if (!organization || typeof organization !== "object")
      return organizationId || "-";
    return organization.name ?? "-";
  };

  const getInitials = (name = "") =>
    name.trim().substring(0, 2).toUpperCase() || "NA";

  const visibleColumns = COLUMNS.filter((c) => {
    if (c.key === "organization") return showOrganizationColumn;
    if (c.key === "action") return showActionsColumn;
    return true;
  });

  const headers = visibleColumns.map((col) => {
    if (col.key === "action" || col.key === "status") {
      return { label: col.label, align: "center" };
    }
    return col.label;
  });

  const renderRow = (s, index, isSelected, isStatusLoading) => {
    const studentId = getStudentId(s);
    const isActive = Boolean(s.isActive);

    return (
      <>
        {/* Student Details with avatar */}
        <td className="p-4 font-medium text-[#777777]">
          <div
            className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
          >
            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {getInitials(s.name)}
            </div>
            <div onClick={() => onViewClick?.(s)} className="flex flex-col min-w-0">
              <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors truncate max-w-[150px]" title={s.name}>
                {s.name || "-"}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]" title={s.studentId}>
                {s.studentId || "-"}
              </span>
            </div>
          </div>
        </td>

        {/* Course */}
        <td className="p-4 text-start text-gray-500">
          <div className="truncate max-w-[120px]" title={s.course?.name || s.course || "-"}>
            {s.course?.name || s.course || "-"}
          </div>
        </td>

        {/* Department */}
        <td className="p-4 text-start text-gray-500">
          <div className="truncate max-w-[150px]" title={s.department?.name || s.department || "-"}>
            {s.department?.name || s.department || "-"}
          </div>
        </td>

        {/* Organization */}
        {showOrganizationColumn && (
          <td className="p-4 text-start text-gray-500">
            <div className="flex items-center gap-2 text-gray-500">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {getOrganizationName(s.organization, s.organizationId)}
              </span>
            </div>
          </td>
        )}

        {/* Hostel */}
        <td className="p-4 text-start text-gray-500">
          <div className="flex items-center gap-2 text-gray-500">
            <Home className="w-3.5 h-3.5 text-gray-400" />
            <span>{getHostelName(s.hostel)}</span>
          </div>
        </td>

        {/* Status */}
        <td className="p-4 text-center">
          {canManage ? (
            <div className="relative inline-block w-[105px]">
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
          )}
        </td>

        {/* Actions */}
        {showActionsColumn && (
          <td className="p-4">
            <div className="flex gap-3 items-center justify-center">
              {canManage && (
                <button
                  onClick={() => !isStatusLoading && onEditClick?.(s)}
                  className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit student"
                >
                  <Pencil className="w-4 h-4 text-secondary" />
                </button>
              )}
            </div>
          </td>
        )}
      </>
    );
  };

  const renderMobileItem = (s, isSelected) => {
    const isActive = Boolean(s.isActive);
    return (
      <div className="mt-2">
        <InfoCard
          avatar={s.name}
          title={s.name || "-"}
          subtitle={s.studentId || "-"}
          onClick={() => onViewClick?.(s)}
          status={{ text: isActive ? t("active") : t("inactive"), color: isActive ? "green" : "red" }}
          fields={[
            // { label: "Course", value: s.course?.name || s.course || "-" },
            // { label: "Department", value: s.department?.name || s.department || "-" },
            showOrganizationColumn && { label: "Organization", value: getOrganizationName(s.organization, s.organizationId) },
            { label: "Hostel", value: getHostelName(s.hostel) },
          ].filter(Boolean)}
          editable={canManage}
          onEdit={() => !statusLoadingIds.includes(getStudentId(s)) && onEditClick?.(s)}
        />
      </div>
    );
  };

  const toolbarActions = (
    <div className="flex gap-3 w-full sm:w-auto">
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {(canEdit || canDelete) && (
        <div className="relative" ref={bulkMenuRef}>
          <button
            onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
            className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-[#777777] hover:bg-gray-50 transition-colors shadow-sm md:shadow-none cursor-pointer h-full"
          >
            <MoreVertical className="w-4 h-4" />
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
    </div>
  );

  return (
    <DataTable
      searchQuery={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      searchPlaceholder="Search Students..."
      toolbarActions={toolbarActions}
      onAdd={canCreate ? onAddClick : undefined}
      addText="Add New"
      onExport={onExport}
      headers={headers}
      items={students}
      loading={loading}
      error={error}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      onSelect={onSelectRow}
      canSelect={true}
      statusLoadingIds={statusLoadingIds}
      emptyText="No records found matching your search criteria."
      renderRow={renderRow}
      renderMobileItem={renderMobileItem}
      onRowClick={onViewClick}
    />
  );
}
