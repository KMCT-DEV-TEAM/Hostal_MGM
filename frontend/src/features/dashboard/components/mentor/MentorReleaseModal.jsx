import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function MentorReleaseModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid release reason is required');
      return;
    }
    if (reason.trim().length > 500) {
      setError('Reason cannot exceed 500 characters');
      return;
    }
    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Release Mentor"
      subtitle="Are you sure you want to release the mentor from this active assignment? This will move it to the history timeline."
      maxWidth="max-w-md"
      asForm
      onSubmit={handleSubmit}
      bottomSheetOnMobile={true}
      zIndex={70}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            variant="outline"
            size="sm"
            fullWidth={false}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            variant="danger"
            size="sm"
            fullWidth={false}
          >
            Release Mentor
          </Button>
        </div>
      }
    >
      <div className="py-2 space-y-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Reason for Release <span className="text-danger">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          rows={3}
          className={`w-full px-3 py-2 bg-gray-50/50 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors resize-none ${
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-gray-200 focus:border-primary focus:ring-primary'
          }`}
          placeholder="Please specify the reason for releasing this mentor..."
          required
        />
        {error && <p className="text-danger text-[10px] mt-1 ml-1 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
