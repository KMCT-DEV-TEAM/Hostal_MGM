import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getParents } from '@/services/parent.service';

export function useParents(filters) {
  const role = useAuthStore((s) => s.user?.role);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParents = useCallback(() => {
    if (!role) {
      setParents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const params = Object.fromEntries(
      Object.entries(filters || {}).filter(([, value]) => value !== '')
    );

    Promise.resolve()
      .then(() => getParents(role, params))
      .then((data) => {
        setParents(Array.isArray(data?.parents) ? data.parents : []);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [role, filters]);

  useEffect(() => { fetchParents(); }, [fetchParents]);

  return { parents, setParents, loading, error, refetch: fetchParents };
}
