import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { setDefaultGuardian } from "@/services/parent.service";
import {
  showSuccessToast,
  showErrorToast,
} from "@/utils/toast";

export function useDefaultGuardian(onSuccess) {
  const role = useAuthStore((s) => s.user?.role);

  const [loading, setLoading] = useState(false);

  const handleSetDefaultGuardian = async (
    parentId
  ) => {
    try {
      setLoading(true);

      const result =
        await setDefaultGuardian(role, parentId);

      showSuccessToast(
        result?.message ||
          "Default guardian updated successfully"
      );

      onSuccess?.(result);

      return result;
    } catch (error) {
      showErrorToast(
        error?.message ||
          "Failed to update guardian"
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSetDefaultGuardian,
  };
}