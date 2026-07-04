import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import furnitureApi from '@/features/furniture/api/furnitureApi';

// Deep equality check helper
function useDeepCompareMemoize(value) {
  const ref = useRef(value);
  if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

export function useFurniture(filters, options = {}) {
  const { enabled = true } = options;
  const role = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const memoizedFilters = useDeepCompareMemoize(filters || {});

  const fetchFurniture = useCallback(() => {
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

    Promise.resolve()
      .then(() => {
          if (role === 'warden') {
              return furnitureApi.getAllFurnitureAssets(params);
          }
          return furnitureApi.getFurnitureTypes(params);
      })
      .then((res) => {
        const list = res?.data?.data || res?.data?.assets || res?.data || res || [];
        setData(Array.isArray(list) ? list : []);
        
        const responsePagination = res?.data?.pagination || res?.pagination || {
            totalPages: res?.data?.totalPages || res?.totalPages || Math.ceil((res?.data?.total || res?.total || res?.data?.totalCount || res?.totalCount || 0) / (params.limit || 10)) || 1,
            totalRecords: res?.data?.total || res?.total || res?.data?.totalCount || res?.totalCount || 0,
            page: params.page || 1,
            limit: params.limit || 10
        };
        if (responsePagination) {
          setPagination(responsePagination);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch furniture:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [role, memoizedFilters, enabled]);

  useEffect(() => { fetchFurniture(); }, [fetchFurniture]);

  return { data, setData, pagination, loading, error, refetch: fetchFurniture };
}
