import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AsyncDropdown from '@/components/ui/AsyncDropdown';
import mentorService from '@/services/mentor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function MentorAssignmentModal({
  isOpen,
  onClose,
  batchId,
  organizationId,
  existingAssignmentId, // If provided, it's a transfer
  onSuccess
}) {
  const role = useAuthStore((s) => s.user?.role);

  const [formData, setFormData] = useState({
    mentorId: '',
    remarks: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMentors = async (search) => {
    if (!role) return [];
    try {
      // Fetch active mentors for the specific organization
      const response = await mentorService.getMentors(role, {
        organizationId: organizationId,
        isActive: 'true',
        search,
        limit: 50
      });
      const data = response?.data || [];
      return {
        options: data,
        hasMore: false // No pagination needed here since limit is 50
      };
    } catch (error) {
      console.error("Failed to fetch mentors", error);
      return { options: [], hasMore: false };
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.mentorId) newErrors.mentorId = "Mentor is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        mentorId: formData.mentorId,
        remarks: formData.remarks
      };

      if (existingAssignmentId) {
        // Transfer mentor
        // The API might expect newMentorId for transfer depending on how it's implemented.
        // The docs say: { "newMentorId": "...", "remarks": "..." }
        await mentorService.transferMentor(existingAssignmentId, {
          newMentorId: formData.mentorId,
          remarks: formData.remarks
        });
        showSuccessToast('Mentor transferred successfully');
      } else {
        // Assign new mentor
        // The docs say: { "mentorId": "...", "batchId": "...", "remarks": "..." }
        await mentorService.assignMentor({
          ...payload,
          batchId
        });
        showSuccessToast('Mentor assigned successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to assign mentor');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <p className="text-danger text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error}</p>;
  };

  return (
    <Modal
      bottomSheetOnMobile={true}
      isOpen={isOpen}
      onClose={onClose}
      title={existingAssignmentId ? "Transfer Mentor" : "Assign Mentor"}
      titleSize="text-lg"
      subtitle={existingAssignmentId ? "Transfer mentorship to a new mentor" : "Assign a mentor to this batch"}
      maxWidth="max-w-xl"
      asForm
      onSubmit={handleSubmit}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {existingAssignmentId ? "Transfer" : "Assign"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 border border-gray-200 text-text-secondary rounded-md text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="space-y-4 md:space-y-5 py-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select Mentor <span className="text-danger">*</span>
          </label>
          <AsyncDropdown
            value={formData.mentorId}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, mentorId: val }));
              if (errors.mentorId) setErrors(prev => ({ ...prev, mentorId: "" }));
            }}
            fetchOptions={fetchMentors}
            getOptionLabel={(opt) => opt.name ? `${opt.name} (${opt.email})` : 'Select Mentor'}
            getOptionValue={(opt) => opt._id || opt.id}
            placeholder="Search and select mentor..."
          />
          <ErrorMessage error={errors.mentorId} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Remarks (Optional)
          </label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            placeholder="Enter any assignment remarks or reasons..."
          />
        </div>
      </div>
    </Modal>
  );
}
