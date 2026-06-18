import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getStudents } from '@/services/student.service';

export function useStudents(filters) {
  const role = useAuthStore((s) => s.user?.role);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchStudents = useCallback(() => {
    if (!role) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '')
    );

    Promise.resolve()
      .then(() => getStudents(role, params))
      .then((data) => {
        setStudents(Array.isArray(data?.students) ? data.students : []);
        setPagination({
          page: data?.pagination?.page || params.page || 1,
          limit: data?.pagination?.limit || params.limit || 10,
          totalRecords: data?.pagination?.totalRecords || 0,
          totalPages: data?.pagination?.totalPages || 1,
          hasNextPage: data?.pagination?.hasNextPage || false,
          hasPreviousPage: data?.pagination?.hasPreviousPage || false,
        });
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [role, filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return { students, setStudents, loading, error, pagination, refetch: fetchStudents };
}
