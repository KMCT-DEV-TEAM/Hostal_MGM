import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getStudents } from '@/services/student.service';

export function useStudents(filters) {
  const role = useAuthStore((s) => s.user?.role);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [role, filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return { students, setStudents, loading, error, refetch: fetchStudents };
}
