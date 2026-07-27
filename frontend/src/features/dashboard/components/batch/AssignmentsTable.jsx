import React from 'react';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';
import { Building2, User } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AssignmentsTable({
  assignments,
  loading,
  error,
  page,
  setPage,
  limit,
  setLimit,
  totalPages,
  onRowClick,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) {
  const { t } = useTranslation();

  const filteredAssignments = assignments; // Server‑side filtering; using assignments directly

  const columns = [
    { key: 'batch', header: t('batch'), accessor: (o) => o.batchId?.name || o.batchId },
    { key: 'Batch code', header: t('Batch code'), accessor: (o) => o.batchId?.code },
    { key: 'assignedBy', header: t('Assigned By'), accessor: (o) => o.assignedBy?.name || '-' },
    {
      key: 'assignedAt',
      header: t('Assigned Date'),
      accessor: (o) =>
        new Date(o.assignedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'status',
      header: t('status'),
      accessor: (o) => o.status,
      renderCell: (o) => <StatusBadge status={o.status} />,
    }
  ];

  // Card configuration for responsive view (mobile)
  const cardConfig = {
    avatar: (o) => o.organizationId?.name?.substring(0, 2)?.toUpperCase() || 'NA',
    title: (o) => o.batchId?.name || 'N/A',
    fields: [
      { icon: Building2, value: (o) => o.organizationId?.name || 'N/A' },
      { icon: User, value: (o) => o.assignedBy?.name || 'N/A' },
    ],
    status: (o) => ({
      text: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      color: o.status === 'active' ? "green" : o.status === 'completed' ? "yellow" : o.status === 'transferred' ? "blue" : "yellow"
    }),
  };


  const toolbarEndSlot = (
    <Dropdown
      options={['All', 'Active', 'Transferred', 'Completed', 'Cancelled']}
      value={statusFilter}
      onChange={(val) => setStatusFilter(val)}
    />
  );

  return (
    <DataView
      data={filteredAssignments}
      pageScrollMode={true}

      columns={columns}
      cardConfig={cardConfig}
      loading={loading}
      error={error}
      page={page}
      setPage={setPage}
      limit={limit}
      setLimit={setLimit}
      totalPages={totalPages}
      onRowClick={(item) => onRowClick && onRowClick(item)}
      emptyText={t('no_records_found')}
      searchQuery={searchQuery}
      onSearchChange={(e) => setSearchQuery(e.target.value)}
      toolbarEndSlot={toolbarEndSlot}
    />
  );
}
