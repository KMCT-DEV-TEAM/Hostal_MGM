import React from 'react';
import Modal from '../ui/Modal';
import DetailRow from '../ui/DetailRow';
import DetailCard from '../ui/DetailCard';
import { Bubbles, Building2Icon, CalendarIcon, CaptionsIcon, ClockIcon, HashIcon, Shield, UserIcon } from 'lucide-react';

const AssignmentDetailsModal = ({ isOpen, onClose, assignment }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Details">
      {assignment ? (
        <DetailCard title="Assignment Details">
          {/* <DetailRow label="Mentor" value={assignment.mentorId?.name || assignment.mentorId} /> */}
          <DetailRow icon={<Building2Icon className="w-4 h-4" />} label="Organization" value={assignment.organizationId?.name || assignment.organizationId} />
          <DetailRow icon={<CaptionsIcon className="w-4 h-4" />} label="Batch" value={assignment.batchId?.name || assignment.batchId} />
          <DetailRow icon={<HashIcon className="w-4 h-4" />} label="Batch Code" value={assignment.batchId?.code || '-'} />
          <DetailRow icon={<Shield className="w-4 h-4" />} label="Status" value={assignment.status} />
          <DetailRow icon={<UserIcon className="w-4 h-4" />} label="Assigned By" value={assignment.assignedBy?.name || assignment.assignedBy} />
          <DetailRow icon={<CalendarIcon className="w-4 h-4" />} label="Assigned At" value={new Date(assignment.assignedAt).toLocaleString()} />
          {assignment.remarks && <DetailRow icon={<Bubbles className="w-4 h-4" />} label="Remarks" value={assignment.remarks} />}
          {assignment.endedAt && <DetailRow icon={<ClockIcon className="w-4 h-4" />} label="Ended At" value={new Date(assignment.endedAt).toLocaleString()} />}
        </DetailCard>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      )}
    </Modal>
  );
};

export default AssignmentDetailsModal;
