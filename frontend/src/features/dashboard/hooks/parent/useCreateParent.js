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
      const errorCode = err?.code || err?.response?.data?.code;

      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to create parent";

      setError(err);

      if (errorCode !== "PARENT_EXISTS_WITH_DIFFERENT_DATA") {
        showErrorToast(message);
      }

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
