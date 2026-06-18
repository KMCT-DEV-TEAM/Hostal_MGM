import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getParents } from '@/services/parent.service';

export function useParents(filters) {
  const role = useAuthStore((s) => s.user?.role);
  const [parents, setParents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterString = JSON.stringify(filters || {});

  const fetchParents = useCallback(() => {
    if (!role) {
      setParents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const parsedFilters = JSON.parse(filterString);
    const params = Object.fromEntries(
      Object.entries(parsedFilters).filter(([, value]) => value !== '')
    );

    Promise.resolve()
      .then(() => getParents(role, params))
      .then((data) => {
        setParents(Array.isArray(data?.parents) ? data.parents : []);
        if (data?.pagination) {
            setPagination(data.pagination);
        }
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [role, filterString]);

  useEffect(() => { fetchParents(); }, [fetchParents]);

  return { parents, setParents, pagination, loading, error, refetch: fetchParents };
}
