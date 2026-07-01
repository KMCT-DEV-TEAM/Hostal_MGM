import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  User,
  Calendar,
  Tag,
  Clock,
  Home,
  Loader2
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import ComplaintService from "@/services/complaint.service";
import { useAuthStore } from "@/store/useAuthStore";

import InfoRow from "@/components/ui/InfoRow";

const WardenComplaintDetailView = ({ complaint, onClose, onOpenAssignStaff, onRefresh }) => {
  const { user } = useAuthStore();
  const [internalNote, setInternalNote] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) {
      showErrorToast('Validation', 'Please provide a note text.');
      return;
    }
    setIsProcessing(true);
    try {
      await ComplaintService.addInternalNote(complaint.id, internalNote);
      showSuccessToast('Success', 'Internal note added successfully.');
      setInternalNote('');
      if (onRefresh) onRefresh();
    } catch (error) {
      showErrorToast('Error', error.message || 'Could not add internal note.');
    } finally {
      setIsProcessing(false);
    }
  };

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
    t.status === 'Rejected' ||
    t.status === 'Incomplete' ||
    t.message.toLowerCase().includes('assign') ||
    t.message.toLowerCase().includes('reject') ||
    t.message.toLowerCase().includes('approv')
  ).reverse();

  // "Internal notes"
  const systemNotes = timeline
    .filter(t => t.message.toLowerCase().includes('note') || t.status === 'Rejected' || t.status === 'Incomplete')
    .map(t => ({
      note: t.message,
      addedBy: 'System/Auto',
      role: t.by,
      date: t.date,
      isSystem: true
    }));
  const internalNotes = [...(complaint.internalNotes || []), ...systemNotes].sort((a, b) => new Date(b.date) - new Date(a.date));

  const getStatusDotColor = (status) => {
    if (status === 'In progress') return 'bg-primary';
    if (status === 'Pending') return 'bg-warning';
    if (status === 'Awaiting') return 'bg-[#DB7017]';
    if (status === 'Rejected') return 'bg-danger';
    if (status === 'Incomplete') return 'bg-primary';
    return 'bg-purple-500';
  };

  const getStatusBadgeColors = (status) => {
    if (status === 'In progress') return 'bg-primary/10 text-primary';
    if (status === 'Pending') return 'bg-warning/10 text-warning';
    if (status === 'Awaiting') return 'bg-[#DB7017]/10 text-[#DB7017]';
    if (status === 'Rejected') return 'bg-red-50 text-danger';
    if (status === 'Incomplete') return 'bg-primary/10 text-primary';
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

  const handleCloseTask = async () => {
    if (!closeNote.trim()) {
      showErrorToast('Validation', 'Please provide a note for closing the task.');
      return;
    }
    setIsProcessing(true);
    try {
      const roleName = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Warden';
      const userName = user?.name || 'Unknown';
      const formattedMessage = `${roleName} ${userName} closed the task with note: ${closeNote}`;
      
      await ComplaintService.updateComplaintStatus(complaint.id, 'Incomplete', formattedMessage);
      showSuccessToast('Success', 'Complaint closed as incomplete.');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      showErrorToast('Error', error.message || 'Could not close complaint.');
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
      icon={<User size={24} />}
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
                  <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                  {complaint.priority || 'High'}
                </span>
              </InfoRow>
              <InfoRow label="Status">
                <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-black">
                  <span className={`w-2 h-2 rounded-full ${complaint.status === 'Pending' ? 'bg-warning' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Incomplete' ? 'bg-primary' : 'bg-blue-500'}`}></span>
                  {complaint.status}
                </span>
              </InfoRow>
              <InfoRow label="Warden">
                {complaint.hostelId?.wardens?.map(w => w.name).join(', ') || 'Not assigned'}
              </InfoRow>
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

            {(complaint.status === 'Awaiting' || complaint.status === 'Resolved') ? (
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
                          className="flex-1 flex items-center justify-center min-w-[150px] bg-success text-white py-2 rounded-lg text-sm font-medium hover:bg-success/60 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve Resolution'}
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
                        <label className="block text-xs font-medium text-text-secondary">Rejection Note <span className="text-danger">*</span></label>
                        <textarea
                          rows={2}
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Explain why the resolution is rejected..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-danger"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={handleReject}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center min-w-[120px] bg-danger text-white py-2 rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
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
              <div className="text-[13px] font-semibold text-danger italic">Not resolved yet</div>
            )}
          </div>

          {/* Internal note */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Internal note</h3>
                <p className="text-[11px] text-text-secondary">Add a note visible to Admins and Wardens</p>
              </div>
              {internalNotes.length > 5 && (
                <button onClick={() => setShowAllNotes(!showAllNotes)} className="text-[11px] text-primary hover:underline cursor-pointer">
                  {showAllNotes ? 'View less' : 'View all'}
                </button>
              )}
            </div>

            <div className="space-y-3 mb-4">
              {(showAllNotes ? internalNotes : internalNotes.slice(0, 5)).length > 0 ? (showAllNotes ? internalNotes : internalNotes.slice(0, 5)).map((n, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[13px] text-text-secondary">{n.note}</span>
                    <span className="text-[10px] text-text-secondary whitespace-nowrap ml-2">{new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="text-[10px] text-primary font-medium">by {n.addedBy} ({n.role})</span>
                </div>
              )) : (
                <div className="text-[13px] text-text-secondary italic">No internal notes yet.</div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Type your note here..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleAddInternalNote}
                disabled={isProcessing || !internalNote.trim()}
                className="flex items-center justify-center min-w-[60px] px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
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

          {/* Task Rejected Actions */}
          {complaint.status === 'Rejected' && ['admin', 'super_admin', 'warden'].includes(user?.role) && (
            <div className="border border-danger/20 bg-danger/10 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-danger mb-1">Task Rejected</h3>
              <p className="text-[11px] text-danger mb-4">This task was rejected by the assigned maintenance staff. Please close the task or re-assign it to someone else.</p>
              
              {!showClosePrompt ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClosePrompt(true)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close Task
                  </button>
                  <button
                    onClick={() => onOpenAssignStaff && onOpenAssignStaff(complaint)}
                    className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors cursor-pointer"
                  >
                    Re-assign Staff
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  <label className="block text-xs font-medium text-gray-700">Closing Note <span className="text-danger">*</span></label>
                  <textarea
                    rows={2}
                    value={closeNote}
                    onChange={(e) => setCloseNote(e.target.value)}
                    placeholder="Explain why the task is being closed..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseTask}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center min-w-[120px] bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Close'}
                    </button>
                    <button
                      onClick={() => setShowClosePrompt(false)}
                      disabled={isProcessing}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Staff Updates */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Staff Updates</h3>
                <p className="text-[11px] text-text-secondary">Updates by the assigned maintenance staff</p>
              </div>
              <div className="flex items-center gap-3">
                {staffUpdates.length > 5 && (
                  <button onClick={() => setShowAllUpdates(!showAllUpdates)} className="text-[11px] text-primary hover:underline cursor-pointer">
                    {showAllUpdates ? 'View less' : 'View all'}
                  </button>
                )}
                {user?.role === 'admin' && !complaint.assignedStaff && (
                  <button
                    onClick={() => onOpenAssignStaff && onOpenAssignStaff(complaint)}
                    className="px-4 py-1.5 text-[11px] font-medium text-white bg-primary rounded-md hover:bg-primary/80 transition-colors cursor-pointer"
                  >
                    Assign staff
                  </button>
                )}
              </div>
            </div>

            {(showAllUpdates ? staffUpdates : staffUpdates.slice(0, 5)).length > 0 ? (
              <div className="relative pl-3 border-l-2 border-gray-100 space-y-6 ml-2">
                {(showAllUpdates ? staffUpdates : staffUpdates.slice(0, 5)).map((update, idx) => (
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
                  <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-[#DB7017]' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Awaiting' ? 'bg-warning' : complaint.status === 'Rejected' ? 'bg-danger' : complaint.status === 'Incomplete' ? 'bg-primary' : 'bg-primary'}`}></span>
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
