
import { Phone, X, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useDefaultGuardian } from "../../hooks/parent/useDefaultGuardian";

export default function SetDefaultParentModal({
  parents = [],
  onClose,
  onDefaultChange,
}) {
  const defaultIndex = useMemo(
    () => parents.findIndex((p) => p.defaultGuardian),
    [parents]
  );

  const [selectedParent, setSelectedParent] = useState(
    defaultIndex >= 0 ? defaultIndex : 0
  );

  const [showConfirm, setShowConfirm] = useState(false);

  const { loading, handleSetDefaultGuardian } =
    useDefaultGuardian(async (result) => {
      const updatedParentId = result?.data?.parentId ?? selectedParentData?._id;
      onDefaultChange?.(updatedParentId, result);
      onClose();
    });

  const selectedParentData = parents[selectedParent];

  const handleSaveClick = () => {
    if (!selectedParentData) return;

    if (selectedParentData.defaultGuardian) {
      onClose();
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      await handleSetDefaultGuardian(
        selectedParentData._id
      );

      setShowConfirm(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] p-4">
        <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Set Default Parent
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Select the parent who will act as the
                default guardian for this student.
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Select Parent
            </label>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {parents.map((parent, index) => {
                const active =
                  selectedParent === index;

                return (
                  <div
                    key={parent._id}
                    onClick={() =>
                      setSelectedParent(index)
                    }
                    className={`cursor-pointer rounded-lg border p-4 transition-all
                      ${
                        active
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div
                          className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border
                          ${
                            active
                              ? "border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {active && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {parent.parentName}
                          </h4>

                          <p className="text-xs text-gray-500">
                            {parent.relationship}
                          </p>

                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <Phone
                              size={12}
                              className="text-primary"
                            />
                            {parent.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {parent.defaultGuardian && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-700">
                            <ShieldCheck size={10} />
                            Current Guardian
                          </span>
                        )}

                        {active &&
                          !parent.defaultGuardian && (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-primary">
                              Selected
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="h-10 min-w-[110px] rounded-md border border-primary bg-white px-5 text-sm font-medium text-primary hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveClick}
                disabled={
                  loading || !selectedParentData
                }
                className="h-10 min-w-[110px] rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Saving..."
                  : "Set Guardian"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        isSubmitting={loading}
        title="Set Default Guardian"
        message={`Are you sure you want to make "${selectedParentData?.parentName}" the default guardian? The previous default guardian will be removed automatically.`}
        confirmText="Set Guardian"
        loadingText="Updating..."
      />
    </>
  );
}
