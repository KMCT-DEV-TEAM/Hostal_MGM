import React, { useEffect, useState } from 'react';
import BatchService from '@/services/batch.service';
import { useAuthStore } from '@/store/useAuthStore';
import BatchHeader from '../components/batch/BatchHeader';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import AssignmentDetailsModal from '@/components/batch/AssignmentDetailsModal';
import AssignmentsTable from '../components/batch/AssignmentsTable';

const MentorBatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { user } = useAuthStore();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter.toLowerCase(),
        mentorId: user?.id || user?._id,
      };
      const res = await BatchService.getMentorBatches(params);
      if (res && res.data) {
        setBatches(res.data);
        const total = res.totalCount || 0;
        setTotalPages(res.totalPages || Math.ceil(total / limit) || 1);
      }
    } catch (err) {
      console.error('Failed to fetch mentor batches:', err);
      setError('Failed to fetch batches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (batch) => {
    try {
      const res = await BatchService.getMentorAssignmentById(batch._id);
      if (res && res.data) {
        setSelectedAssignment(res.data);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch assignment details', err);
      showErrorToast('Unable to load assignment details');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchBatches();
  }, [page, limit, debouncedSearch, statusFilter]);

  return (
    <div className={`w-full h-[calc(100vh-82px)] overflow-y-auto overscroll-contain bg-[#F8FAFC] text-black flex flex-col relative`}>
      <div className="p-4 md:p-6 flex-1 flex flex-col">
        <BatchHeader
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
          <AssignmentsTable
            assignments={batches}
            loading={loading}
            error={error}
            page={page}
            setPage={setPage}
            setStatusFilter={setStatusFilter}
            totalPages={totalPages}
            limit={limit}
            setLimit={setLimit}
            onRowClick={handleRowClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
          />
          <AssignmentDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            assignment={selectedAssignment}
          />
        </div>
      </div>
    </div>
  );
};

export default MentorBatchManagement;
