import React from 'react';
import Modal from '../ui/Modal';
import DetailRow from '../ui/DetailRow';
import DetailCard from '../ui/DetailCard';

const AssignmentDetailsModal = ({ isOpen, onClose, assignment }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Details">
      {assignment ? (
        <DetailCard title="Assignment Details">
          {/* <DetailRow label="Mentor" value={assignment.mentorId?.name || assignment.mentorId} /> */}
          <DetailRow label="Organization" value={assignment.organizationId?.name || assignment.organizationId} />
          <DetailRow label="Batch" value={assignment.batchId?.name || assignment.batchId} />
          <DetailRow label="Batch Code" value={assignment.batchId?.code || '-'} />
          <DetailRow label="Status" value={assignment.status} />
          <DetailRow label="Assigned By" value={assignment.assignedBy?.name || assignment.assignedBy} />
          <DetailRow label="Assigned At" value={new Date(assignment.assignedAt).toLocaleString()} />
          {assignment.remarks && <DetailRow label="Remarks" value={assignment.remarks} />}
          {assignment.endedAt && <DetailRow label="Ended At" value={new Date(assignment.endedAt).toLocaleString()} />}
        </DetailCard>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      )}
    </Modal>
  );
};

export default AssignmentDetailsModal;
