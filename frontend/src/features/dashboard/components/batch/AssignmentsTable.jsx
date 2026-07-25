import React, { useState, useMemo } from 'react';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';
import { Building2, User } from 'lucide-react';

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
}) {
  const { t } = useTranslation();

  // UI state for search and status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Active | History

  // Client‑side filtering
  const filteredAssignments = useMemo(() => {
    let data = assignments || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((a) => {
        return (
          (a.batchId?.name && a.batchId.name.toLowerCase().includes(q)) ||
          (a.batchId?.code && a.batchId.code.toLowerCase().includes(q)) ||
          (a.mentorId?.name && a.mentorId.name.toLowerCase().includes(q)) ||
          (a.organizationId?.name && a.organizationId.name.toLowerCase().includes(q)) ||
          (a.assignedBy?.name && a.assignedBy.name.toLowerCase().includes(q))
        );
      });
    }
    if (statusFilter !== 'All') {
      if (statusFilter === 'History') {
        data = data.filter((a) => a.status !== 'active');
      } else {
        data = data.filter((a) => a.status === statusFilter.toLowerCase());
      }
    }
    return data;
  }, [assignments, searchQuery, statusFilter]);

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
      renderCell: (o) => {
        const isActive = o.status === 'active';
        const isCompleted = o.status === 'completed';
        const isTransferred = o.status === 'transferred';
        const colorClass = isActive
          ? 'text-success bg-green-50'
          : isCompleted
            ? 'text-yellow-500 bg-yellow-50'
            : isTransferred
              ? 'text-blue-500 bg-blue-50'
              : 'text-danger bg-red-50';
        return (
          <span className={`px-2 py-1 rounded ${colorClass}`}>
            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
          </span>
        );
      },
    },
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
      options={['All', 'Active', 'History']}
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
