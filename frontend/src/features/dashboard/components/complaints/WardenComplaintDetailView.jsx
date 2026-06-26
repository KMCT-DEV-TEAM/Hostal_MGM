import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  User,
  Calendar,
  Tag,
  Clock,
  Home
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import ComplaintService from "@/services/complaint.service";
import { useAuthStore } from "@/store/useAuthStore";

const InfoRow = ({ label, children }) => (
  <div className="flex text-[13px] gap-3 items-start py-1">
    <span className="text-gray-500 w-20 shrink-0">{label}</span>
    <span className="text-gray-400 shrink-0 -ml-1">:</span>
    <span className="font-medium text-black flex-1">{children}</span>
  </div>
);

const WardenComplaintDetailView = ({ complaint, onClose, onOpenAssignStaff, onRefresh }) => {
  const { user } = useAuthStore();
  const [internalNote, setInternalNote] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!complaint) return null;

  const timeline = complaint.timeline || [];

  // Recent updates (most recent first)
  const recentUpdates = timeline.slice().reverse();

  // "Staff Updates" logic based on assignments and progress
  const staffUpdates = timeline.filter(t =>
    t.by === 'Student' ||
    t.status === 'Pending' ||
    t.by.toLowerCase().includes('staff') ||
    t.status === 'In progress' ||
    t.status === 'Awaiting' ||
    t.status === 'Resolved' ||
    t.message.toLowerCase().includes('assign') ||
    t.message.toLowerCase().includes('reject') ||
    t.message.toLowerCase().includes('approv')
  ).reverse();

  // "Internal notes"
  const internalNotes = timeline.filter(t => t.by === 'Warden' || t.by === 'Admin' || t.message.toLowerCase().includes('note'));

  const getStatusDotColor = (status) => {
    if (status === 'In progress') return 'bg-primary';
    if (status === 'Pending') return 'bg-warning';
    if (status === 'Awaiting') return 'bg-[#DB7017]';
    return 'bg-purple-500';
  };

  const getStatusBadgeColors = (status) => {
    if (status === 'In progress') return 'bg-primary/10 text-primary';
    if (status === 'Pending') return 'bg-warning/10 text-warning';
    if (status === 'Awaiting') return 'bg-[#DB7017]/10 text-[#DB7017]';
    return 'bg-[#8F64C8]/10 text-[#8F64C8]';
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await ComplaintService.approveComplaintResolution(complaint.id);
      showSuccessToast('Success', 'Complaint resolution approved.');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      showErrorToast('Error', error.message || 'Could not approve resolution.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      showErrorToast('Validation', 'Please provide a note for rejection.');
      return;
    }
    setIsProcessing(true);
    try {
      await ComplaintService.rejectComplaintResolution(complaint.id, rejectNote);
      showSuccessToast('Success', 'Complaint resolution rejected.');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      showErrorToast('Error', error.message || 'Could not reject resolution.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-5xl"
      title="Complaint Details"
      subtitle={`${complaint.student} - ${complaint.roomNo}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 parts width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Complaint Information */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-1">Complaint Information</h3>
            <p className="text-[11px] text-text-secondary mb-4">Basic Details about the complaint</p>
            <div className="space-y-1">
              <InfoRow label="Student">{complaint.student}</InfoRow>
              <InfoRow label="Hostel">{complaint.hostelName}</InfoRow>
              <InfoRow label="Category">{complaint.category}</InfoRow>
              <InfoRow label="Date">{complaint.date}</InfoRow>
              <InfoRow label="Priority">
                <span className="inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium text-danger ">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {complaint.priority || 'High'}
                </span>
              </InfoRow>
              <InfoRow label="Status">
                <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-black">
                  <span className={`w-2 h-2 rounded-full ${complaint.status === 'Pending' ? 'bg-yellow-400' : complaint.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  {complaint.status}
                </span>
              </InfoRow>
              <InfoRow label="Warden">Arjun Menon</InfoRow>
            </div>
          </div>

          {/* Complaint Description */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-1">Complaint Description</h3>
            <p className="text-[11px] text-text-secondary mb-4">Review the issue reported by the student.</p>
            <div className="space-y-1">
              <InfoRow label="Subject">{complaint.subject}</InfoRow>
              <InfoRow label="Description">{complaint.description || "Food served during lunch was not fresh."}</InfoRow>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm mt-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Resolution Details</h3>
                <p className="text-[11px] text-text-secondary">Details submitted by maintenance staff</p>
              </div>
            </div>

            {(complaint.status === 'Awaiting' || complaint.status === 'Resolved' || complaint.resolutionNotes || complaint.materialsUsed) ? (
              <div className="space-y-4">
                <InfoRow label="Materials Used">
                  {complaint.materialsUsed || 'None'}
                </InfoRow>
                <InfoRow label="Resolution Notes">
                  {complaint.resolutionNotes || 'No notes provided.'}
                </InfoRow>

                {complaint.status === 'Awaiting' && user?.role === 'warden' && (
                  <div className="pt-4 border-t border-gray-100 mt-4 space-y-4">
                    {!showRejectPrompt ? (
                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="flex-1 bg-success text-white py-2 rounded-lg text-sm font-medium hover:bg-success/60 transition-colors cursor-pointer"
                        >
                          Approve Resolution
                        </button>
                        <button
                          onClick={() => setShowRejectPrompt(true)}
                          disabled={isProcessing}
                          className="flex-1 bg-danger/50 text-danger py-2 rounded-lg text-sm font-medium hover:bg-danger/80 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-text-secondary">Rejection Note *</label>
                        <textarea
                          rows={2}
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Explain why the resolution is rejected..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={handleReject}
                            disabled={isProcessing}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setShowRejectPrompt(false)}
                            disabled={isProcessing}
                            className="flex-1 bg-gray-100 text-text-secondary py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[13px] text-text-secondary italic">No resolution details available yet.</div>
            )}
          </div>

          {/* Internal note */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Internal note</h3>
                <p className="text-[11px] text-text-secondary">Add a note by warden</p>
              </div>
              <button className="text-[11px] text-primary hover:underline cursor-pointer">View all</button>
            </div>

            <div className="space-y-3">
              {internalNotes.length > 0 ? internalNotes.map((note, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm flex justify-between items-center">
                  <span className="text-[13px] text-text-secondary">{note.message}</span>
                  <span className="text-[10px] text-text-secondary">{new Date(note.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )) : (
                <div className="text-[13px] text-text-secondary italic">No internal notes yet.</div>
              )}
            </div>
          </div>

          {/* Maintenance Assignment */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-1">Maintenance Assignment</h3>
            <p className="text-[11px] text-text-secondary mb-4">Details of Maintenance Assignment</p>
            <div className="space-y-1">
              <InfoRow label="Assigned Staff">{complaint.assignedStaff?.name || "Not assigned"}</InfoRow>
              <InfoRow label="Specialization">{complaint.assignedStaff?.specialization || "N/A"}</InfoRow>
              <InfoRow label="Assignment Note">Please inspect the issue and resolve</InfoRow>
            </div>
          </div>

          {/* Staff Updates */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Staff Updates</h3>
                <p className="text-[11px] text-text-secondary">Updates by the assigned maintenance staff</p>
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => onOpenAssignStaff && onOpenAssignStaff(complaint)}
                  className="px-4 py-1.5 text-[11px] font-medium text-white bg-primary rounded-md hover:bg-primary/80 transition-colors cursor-pointer"
                >
                  Assign staff
                </button>
              )}
            </div>

            {staffUpdates.length > 0 ? (
              <div className="relative pl-3 border-l-2 border-gray-100 space-y-6 ml-2">
                {staffUpdates.map((update, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusDotColor(update.status)}`}></div>
                    <div className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm ml-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeColors(update.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(update.status)}`}></span>
                          {update.status}
                        </span>
                        <span className="text-[10px] text-text-secondary">{new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[12px] text-text-secondary mb-1">{update.message}</p>
                      <p className="text-[10px] text-text-secondary">by {update.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-text-secondary italic">No staff updates yet.</div>
            )}
          </div>
        </div>

        {/* Right Column (1 part width) */}
        <div className="space-y-6">

          {/* Quick Summary */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-1">Quick Summary</h3>
            <p className="text-[11px] text-text-secondary mb-4">Quick summary of the complaint</p>

            <div className="space-y-1">
              <InfoRow label={<span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Student</span>}>{complaint.student}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Category</span>}>{complaint.category}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Date</span>}>{complaint.date}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Status</span>}>
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-[#DB7017]' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Awaiting' ? 'bg-warning' : 'bg-primary'}`}></span>
                  {complaint.status}
                </span>
              </InfoRow>
              <InfoRow label={<span className="flex items-center gap-2"><Home className="w-3.5 h-3.5" /> Hostel</span>}>{complaint.hostelName}</InfoRow>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-1">Recent Updates</h3>
            <p className="text-[11px] text-text-secondary mb-4">Recent Updates about the complaint</p>

            <div className="space-y-3">
              {recentUpdates.map((update, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[13px] text-gray-700 leading-relaxed">{update.message}</span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap pt-0.5">
                      {new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(update.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                    </span>
                  </div>
                  <span className="text-[12px] text-gray-400">by {update.by}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};

export default WardenComplaintDetailView;
