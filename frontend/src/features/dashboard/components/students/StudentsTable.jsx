import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  Pencil,
  Building2,
  Home,
  BookOpen,
  SlidersHorizontal,
  MoreVertical,
  Plus,
  Download,
  Filter,
  Building
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
  const getStudentId = (s) => s.id ?? s._id;
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


  // 1. Column Configuration (No UI building outside of extremely custom cells)
  const columns = [
    {
      key: "studentName",
      header: "Student Details",
      type: "user",
      truncate: true,
      titleAccessor: (s) => s.name,
      subtitleAccessor: (s) => s.studentId,
      avatarAccessor: (s) => s.name,
    },
    {
      key: "course",
      header: "Course",
      icon: BookOpen,
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
    avatar: (s) => s.name?.split(' ').map(n => n[0]).join('').substring(0, 2),
    title: (s) => s.name || "-",
    subtitle: (s) => s.studentId || "-",
    status: (s) => ({
      text: Boolean(s.isActive) ? t("active") : t("inactive"),
      color: Boolean(s.isActive) ? "green" : "red"
    }),
    fields: [
      { accessor: (s) => s.course?.name || s.course || "-", icon: BookOpen },
      { accessor: (s) => s.department?.name || s.department || "-", icon: Building },
      ...(showOrganizationColumn ? [{ accessor: (s) => getOrganizationName(s.organization, s.organizationId), icon: Building2 }] : []),
    ],
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
        <Filter className="w-8 h-4" />
      </button>

      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center justify-center lg:gap-2 p-2 lg:px-4 lg:py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
        >
          <Download className="w-8 h-4 text-gray-500 lg:text-inherit" />
          <span className="hidden lg:inline">Export</span>
        </button>
      )}

      {(canEdit || canDelete) && (
        <div className="relative" ref={bulkMenuRef}>
          <button
            onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
            className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
          >
            <MoreVertical className="w-8 h-4 text-gray-500" />
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


  const addButton = canCreate && (
    <button
      onClick={onAddClick}
      className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#0A437A] text-white rounded-xl text-sm font-medium hover:bg-[#0A437A]/90 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
    >
      <Plus className="w-4 h-4" />
      Add <span className="hidden sm:inline">
        New
      </span>
    </button>
  )


  return (
    <DataView
      addButton={addButton}
      pageScrollMode={true}
      data={students}
      columns={columns}
      cardConfig={cardConfig}
      loading={loading}
      error={error}
      searchQuery={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      searchPlaceholder="Search Students..."
      canSelect={ROLES.SUPER_ADMIN === role || ROLES.ADMIN === role}
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
