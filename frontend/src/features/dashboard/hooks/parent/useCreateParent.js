import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { createParent } from "@/services/parent.service";
import {
  showSuccessToast,
  showErrorToast,
} from "@/utils/toast";

export function useCreateParent(onSuccess) {
  const role = useAuthStore((s) => s.user?.role);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateParent = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const result = await createParent(role, payload);

      showSuccessToast(
        result?.message || "Parent created successfully"
      );

      onSuccess?.(result, payload);

      return result;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create parent";

      setError(err);

      showErrorToast(message);

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleCreateParent,
    loading,
    error,
  };
}
