import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import mentorService from '@/services/mentor.service';

export function useBatchMentorAssignment(batchId) {
  const role = useAuthStore((s) => s.user?.role);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignment = useCallback(async () => {
    if (!role || !batchId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch ACTIVE assignment for the specific batch
      const response = await mentorService.getMentorAssignments({
        batchId,
        status: 'ACTIVE',
        limit: 1 // We only need the active one
      });
      
      const assignments = response?.data || [];
      setActiveAssignment(assignments.length > 0 ? assignments[0] : null);
    } catch (err) {
      setError(err);
      setActiveAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [role, batchId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  return { activeAssignment, loading, error, refetch: fetchAssignment };
}
