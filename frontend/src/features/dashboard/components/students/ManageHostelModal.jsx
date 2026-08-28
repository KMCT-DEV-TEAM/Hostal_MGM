import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import AsyncDropdown from "@/components/ui/AsyncDropdown";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getSelectionHostels } from "@/services/hostel.service";
import { updateStudentHostel } from "@/services/studentHostel.service";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function ManageHostelModal({ isOpen, onClose, student, onSave }) {
  const [hostelId, setHostelId] = useState("");
  const [hostelsMap, setHostelsMap] = useState({});
  const [roomNumber, setRoomNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      if (student.hostel) {
        const id = student.hostel.id || student.hostelId;
        setHostelId(id);
        setHostelsMap(prev => ({
          ...prev,
          [id]: { label: student.hostel.name }
        }));
      } else {
        setHostelId("");
      }
      setRoomNumber(student.roomNumber || "");
    }
  }, [isOpen, student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hostelId) {
      showErrorToast("Please select a hostel");
      return;
    }
    if (!roomNumber.trim()) {
      showErrorToast("Please enter a room number");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        hostelId: hostelId,
        roomNumber: roomNumber.trim(),
      };
      const res = await updateStudentHostel(student.id, data);
      showSuccessToast(res.message || "Hostel updated successfully");

      const newHostelStatus = "active";
      onSave({
        hostelId: hostelId,
        hostel: { id: hostelId, name: hostelsMap[hostelId]?.label || "Unknown Hostel" },
        roomNumber: roomNumber.trim(),
        hostelStatus: newHostelStatus,
        activeAllocation: res.data?.newAllocation || res.data?.allocation || student.activeAllocation // Attempt to use new allocation data if returned
      });
    } catch (error) {
      showErrorToast(error?.response?.data?.message || error.message || "Failed to update hostel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchHostelOptions = useCallback(async ({ page, search }) => {
    try {
      const res = await getSelectionHostels({ page, search, limit: 20 });
      const data = res.data || [];
      setHostelsMap(prev => {
        const newMap = { ...prev };
        data.forEach(h => {
          newMap[h.id] = { label: h.name };
        });
        return newMap;
      });
      return {
        options: data.map(h => ({ label: h.name, value: h.id })),
        hasMore: data.length === 20
      };
    } catch (error) {
      console.error("Failed to fetch hostels:", error);
      return { options: [], hasMore: false };
    }
  }, []);

  return (
    <Modal
      bottomSheetOnMobile={true}
      isOpen={isOpen}
      onClose={onClose}
      title={student?.hostelId ? "Change Hostel" : "Allocate Hostel"}
      subtitle={`For ${student?.name}`}
      asForm={true}
      maxWidth="max-w-md"
      onSubmit={handleSubmit}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !hostelId || !roomNumber.trim()}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hostel <span className="text-red-500">*</span>
          </label>
          <AsyncDropdown
            value={hostelId}
            onChange={setHostelId}
            fetchOptions={fetchHostelOptions}
            lookup={hostelsMap}
            preload={true}
            placeholder="Search and select hostel..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Number <span className="text-red-500">*</span>
          </label>
          <Input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. A-101"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </Modal>
  );
}

