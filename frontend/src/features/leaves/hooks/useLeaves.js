import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import leaveService from '@/services/leave.service';

// Deep equality check helper
function useDeepCompareMemoize(value) {
  const ref = useRef(value);
  if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

export function useLeaves(filters, isAggregate = false, options = {}) {
  const { enabled = true } = options;
  const role = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const memoizedFilters = useDeepCompareMemoize(filters || {});
  const prevPassTypeRef = useRef(filters?.passType);

  // Clear data instantly when passType changes to prevent stale data flickering under new columns
  useEffect(() => {
    if (filters?.passType !== prevPassTypeRef.current) {
      setData([]);
      prevPassTypeRef.current = filters?.passType;
    }
  }, [filters?.passType]);

  const fetchLeaves = useCallback(() => {
    if (!role || !enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = Object.fromEntries(
      Object.entries(memoizedFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
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
  }, [role, memoizedFilters, isAggregate, enabled]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  return { data, setData, pagination, loading, error, refetch: fetchLeaves };
}
