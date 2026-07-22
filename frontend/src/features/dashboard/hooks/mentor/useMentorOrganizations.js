import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getMentorOrganizations } from '@/services/mentor.service';

export function useMentorOrganizations(filters) {
  const role = useAuthStore((s) => s.user?.role);
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterString = JSON.stringify(filters || {});

  const fetchOrganizations = useCallback(() => {
    if (!role || role !== 'super_admin') {
      setOrganizations([]);
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
      .then(() => getMentorOrganizations(role, params))
      .then((data) => {
        setOrganizations(Array.isArray(data?.data) ? data.data : []);
        setPagination({
            page: data?.currentPage || 1,
            limit: params.limit || 10,
            totalRecords: data?.totalCount || 0,
            totalPages: data?.totalPages || 0
        });
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [role, filterString]);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  return { organizations, setOrganizations, pagination, loading, error, refetch: fetchOrganizations };
}
