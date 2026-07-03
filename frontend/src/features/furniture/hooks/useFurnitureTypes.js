import { useEffect, useState, useCallback, useRef } from 'react';
import furnitureApi from '@/features/furniture/api/furnitureApi';

function useDeepCompareMemoize(value) {
    const ref = useRef(value);
    if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
        ref.current = value;
    }
    return ref.current;
}

export function useFurnitureTypes(filters, options = {}) {
    const { enabled = true } = options;
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const memoizedFilters = useDeepCompareMemoize(filters || {});

    const fetchFurnitureTypes = useCallback(() => {
        if (!enabled) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const params = Object.fromEntries(
            Object.entries(memoizedFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
        );

        furnitureApi.getFurnitureTypes(params)
            .then((res) => {
                const responseData = res?.data?.data || res?.data || {};
                const list = responseData.data || responseData || [];
                setData(Array.isArray(list) ? list : []);

                const total = responseData.total || res?.data?.total || responseData.totalCount || res?.data?.totalCount || 0;

                const responsePagination = res?.data?.pagination || res?.pagination || {
                    totalPages: responseData.totalPages || res?.data?.totalPages || res?.totalPages || Math.ceil(total / (params.limit || 10)) || 1,
                    totalRecords: total,
                    page: params.page || 1,
                    limit: params.limit || 10
                };
                if (responsePagination) {
                    setPagination(responsePagination);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch furniture types:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [memoizedFilters, enabled]);

    useEffect(() => { fetchFurnitureTypes(); }, [fetchFurnitureTypes]);

    return { data, setData, pagination, loading, error, refetch: fetchFurnitureTypes };
}
