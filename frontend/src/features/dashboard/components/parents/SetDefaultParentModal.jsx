import { Phone, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Modal from "@/components/ui/Modal";
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

  // Track whether the user has changed the selection away from the current default
  const isDirty = selectedParent !== defaultIndex && !parents[selectedParent]?.defaultGuardian;

  const [showConfirm, setShowConfirm] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const { loading, handleSetDefaultGuardian } =
    useDefaultGuardian(async (result) => {
      const updatedParentId = result?.data?.parentId ?? selectedParentData?.id;
      onDefaultChange?.(updatedParentId, result);
      // Close immediately after success — no discard prompt needed
      onClose();
    });

  const selectedParentData = parents[selectedParent];

  // Called when user clicks "Set Guardian"
  const handleSaveClick = () => {
    if (!selectedParentData) return;
    // If the selected parent is already the default, just close with no prompt
    if (selectedParentData.defaultGuardian) {
      onClose();
      return;
    }
    setShowConfirm(true);
  };

  // Called when user confirms the "Set Guardian" confirmation
  const handleConfirm = async () => {
    // Dismiss the confirm dialog immediately so it doesn't flash on success
    setShowConfirm(false);
    try {
      await handleSetDefaultGuardian(selectedParentData.id);
    } catch (error) {
      console.error(error);
    }
  };

  // Called when user tries to close (X button or Cancel)
  const handleCloseRequest = () => {
    if (loading) return; // never close mid-request
    // Only ask to discard if the user actually changed the selection
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={showConfirm ? undefined : handleCloseRequest}
        title="Set Default Parent"
        subtitle="Select the parent who will act as the default guardian for this student."
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={handleCloseRequest}
              disabled={loading}
              className="h-10 min-w-[110px] rounded-md border border-primary bg-white px-5 text-sm font-medium text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={loading || !selectedParentData}
              className="h-10 min-w-[110px] rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Set Guardian"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 max-h-[350px] overflow-y-auto mt-2">
          {parents.map((parent, index) => {
            const active = selectedParent === index;

            return (
              <div
                key={parent.id}
                onClick={() => setSelectedParent(index)}
                className={`cursor-pointer rounded-lg border p-4 transition-all
                  ${active
                    ? "border-primary bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border
                      ${active ? "border-primary" : "border-gray-300"}`}
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
                        <Phone size={12} className="text-primary" />
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

                    {active && !parent.defaultGuardian && (
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
      </Modal>

      {/* Confirmation: "Are you sure you want to set this guardian?" */}
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

      {/* Discard: only shown when user changed selection and tries to cancel */}
      <ConfirmationModal
        isOpen={showDiscard}
        onClose={() => setShowDiscard(false)}
        onConfirm={() => {
          setShowDiscard(false);
          onClose();
        }}
        title="Discard Changes"
        message="You have selected a different guardian but haven't saved. Are you sure you want to discard your changes?"
        confirmText="Discard"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 min-w-[100px]"
      />
    </>
  );
}
