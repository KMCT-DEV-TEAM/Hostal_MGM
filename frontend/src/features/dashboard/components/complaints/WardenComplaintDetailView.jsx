import React from "react";
import Modal from "@/components/ui/Modal";
import {
  User,
  Calendar,
  AlertCircle,
  FileText,
  Home,
  Tag,
  Clock,
  MessageSquare
} from "lucide-react";

// Reusable row: stacks on mobile, grid on sm+
const InfoRow = ({ icon, label, children }) => (
  <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-start">
    <span className="text-text-secondary flex items-start gap-1.5 pt-0.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      {label}
    </span>
    <span className="sm:col-span-2 font-medium text-text-primary leading-relaxed">
      <span className="hidden sm:inline">: </span>
      {children}
    </span>
  </div>
);

import { showSuccessToast } from "@/utils/toast";
import { useState } from "react";

const WardenComplaintDetailView = ({ complaint, onClose, onOpenAssignStaff }) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [status, setStatus] = useState('In progress');
  const [note, setNote] = useState('Issue verified and food quality improved.');

  if (!complaint) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-5xl"
      avatar={complaint.student}
      title="Complaint Details"
      subtitle={`Reported by ${complaint.student}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 [&>*:first-child]:order-2 [&>*:last-child]:order-1 lg:[&>*:first-child]:order-none lg:[&>*:last-child]:order-none">
        
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Complaint Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-1">
              Complaint Information
            </h3>
            <p className="text-xs text-text-secondary mb-6">
              Detailed description of the reported issue
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<FileText className="w-4 h-4 text-text-secondary" />}
                label="Subject"
              >
                {complaint.subject || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Tag className="w-4 h-4 text-text-secondary" />}
                label="Category"
              >
                {complaint.category || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<MessageSquare className="w-4 h-4 text-text-secondary" />}
                label="Description"
              >
                {complaint.description || "The student has reported an issue regarding " + (complaint.category?.toLowerCase() || 'the hostel') + ". Please review the details and take necessary action to resolve it promptly."}
              </InfoRow>
              <InfoRow
                icon={<Calendar className="w-4 h-4 text-text-secondary" />}
                label="Reported Date"
              >
                {complaint.date || "N/A"}
              </InfoRow>
            </div>
          </div>

          {/* Location & Status Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-1">
              Location & Status
            </h3>
            <p className="text-xs text-text-secondary mb-6">
              Room assignment and current resolution status
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<Home className="w-4 h-4 text-text-secondary" />}
                label="Room No"
              >
                {complaint.roomNo || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<AlertCircle className="w-4 h-4 text-text-secondary" />}
                label="Priority"
              >
                <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${complaint.priority === 'High' ? 'bg-danger/10 text-danger' : complaint.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-text-secondary'}`}>
                  {complaint.priority || 'Low'}
                </span>
              </InfoRow>
              <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-text-secondary" />
                  Status
                </span>
                <span className="sm:col-span-2 font-medium text-text-primary flex items-center gap-2">
                  <span className="hidden sm:inline">: </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-accent/10 text-blue-500'}`}>
                    {complaint.status || "N/A"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Resolution note */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-lg font-semibold text-primary">Resolution note</h3>
                          <p className="text-xs text-text-secondary">updated status and notes</p>
                      </div>
                      <div className="flex gap-2">
                          <button 
                              onClick={() => onOpenAssignStaff && onOpenAssignStaff(complaint)}
                              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors shadow-sm cursor-pointer"
                          >
                              Assign Staff
                          </button>
                          {isEditingStatus ? (
                              <button 
                                  onClick={() => {
                                      setIsEditingStatus(false);
                                      showSuccessToast("Status Updated", "Resolution note saved successfully");
                                  }}
                                  className="px-4 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                              >
                                  Save
                              </button>
                          ) : (
                              <button 
                                  onClick={() => setIsEditingStatus(true)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                              >
                                  Update Status
                              </button>
                          )}
                      </div>
                  </div>
                  
                  {complaint.assignedStaff && (
                      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 mt-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <div className="text-sm">
                              <span className="text-text-secondary">Assigned to: </span>
                              <span className="font-medium text-text-primary">{complaint.assignedStaff.name}</span>
                              {complaint.assignedStaff.phone && <span className="text-text-secondary text-xs ml-2">({complaint.assignedStaff.phone})</span>}
                          </div>
                      </div>
                  )}
              </div>
              
              {isEditingStatus ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                      <select 
                          value={status} 
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full sm:w-auto px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-primary cursor-pointer"
                      >
                          <option value="Pending">Pending</option>
                          <option value="In progress">In progress</option>
                          <option value="Resolved">Resolved</option>
                      </select>
                      <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary min-h-[80px]"
                          placeholder="Add resolution note..."
                      ></textarea>
                  </div>
              ) : (
                  <>
                      <div className="mb-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border ${status === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : status === 'Resolved' ? 'bg-success/10 text-success border-success/20' : 'bg-accent/10 text-blue-500 border-blue-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status === 'Pending' ? 'bg-warning' : status === 'Resolved' ? 'bg-success' : 'bg-blue-500'}`}></span>
                              {status}
                          </span>
                      </div>
                      <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-gray-700">{note || "No resolution note provided."}</span>
                              <span className="text-xs text-gray-400">Today - 09:00 am</span>
                          </div>
                          <span className="text-[10px] text-gray-400">by Warden</span>
                      </div>
                  </>
              )}
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="bg-white p-5 col-span-2 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">
              Quick Summary
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-text-secondary flex items-center gap-1.5">
                <User className="w-4 h-4 text-text-secondary" /> Student
              </span>
              <span className="sm:col-span-2 font-medium text-text-primary">
                <span className="hidden sm:inline">: </span>
                {complaint.student || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Home className="w-4 h-4 text-text-secondary" /> Room No
              </span>
              <span className="sm:col-span-2 font-medium text-text-primary">
                <span className="hidden sm:inline">: </span>
                {complaint.roomNo || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-text-secondary" /> Category
              </span>
              <span className="sm:col-span-2 font-medium text-text-primary">
                <span className="hidden sm:inline">: </span>
                {complaint.category || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-secondary" /> Date
              </span>
              <span className="sm:col-span-2 font-medium text-text-primary break-words">
                <span className="hidden sm:inline">: </span>
                {complaint.date || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-center">
              <span className="text-text-secondary flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-text-secondary" /> Priority
              </span>
              <span className="sm:col-span-2 font-medium text-text-primary">
                <span className="hidden sm:inline">: </span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${complaint.priority === 'High' ? 'bg-danger/10 text-danger' : complaint.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-text-secondary'}`}>
                  {complaint.priority || 'Low'}
                </span>
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-center">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-text-secondary" /> Status
              </span>
              <span className="sm:col-span-2 font-medium text-text-primary">
                <span className="hidden sm:inline">: </span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-accent/10 text-blue-500'}`}>
                  {complaint.status || "N/A"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WardenComplaintDetailView;
