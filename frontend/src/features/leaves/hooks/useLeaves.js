import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import leaveService from '@/services/leave.service';

export function useLeaves(filters, isAggregate = false, options = {}) {
  const { enabled = true } = options;
  const role = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterString = JSON.stringify(filters || {});

  const fetchLeaves = useCallback(() => {
    if (!role || !enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const parsedFilters = JSON.parse(filterString);
    const params = Object.fromEntries(
      Object.entries(parsedFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );

    const fetcher = isAggregate ? leaveService.getLeaveHostels : leaveService.getLeaves;

    Promise.resolve()
      .then(() => fetcher(role, params))
      .then((res) => {
        // Handle various response structures
        const list = res?.data?.data || res?.data || res?.passes || res?.hostels || res || [];
        setData(Array.isArray(list) ? list : []);
        
        const responsePagination = res?.data?.pagination || res?.pagination;
        if (responsePagination) {
          setPagination(responsePagination);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch leaves:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [role, filterString, isAggregate]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  return { data, setData, pagination, loading, error, refetch: fetchLeaves };
}
