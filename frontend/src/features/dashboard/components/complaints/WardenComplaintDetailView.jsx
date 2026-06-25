import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  User,
  Calendar,
  Tag,
  Clock,
  Home
} from "lucide-react";
import { showSuccessToast } from "@/utils/toast";

const InfoRow = ({ label, children }) => (
  <div className="flex text-[13px] gap-2 items-start py-1">
    <span className="text-gray-500 w-32 shrink-0">{label}</span>
    <span className="font-medium text-gray-800 flex-1">
      <span className="mr-2 text-gray-400">:</span>
      {children}
    </span>
  </div>
);

const WardenComplaintDetailView = ({ complaint, onClose, onOpenAssignStaff }) => {
  const [internalNote, setInternalNote] = useState('');

  if (!complaint) return null;

  const timeline = complaint.timeline || [];
  
  // Recent updates (most recent first)
  const recentUpdates = timeline.slice().reverse();

  // "Staff Updates" logic based on assignments and progress
  const staffUpdates = timeline.filter(t => t.by === 'Student' || t.status === 'Pending' || t.by.toLowerCase().includes('staff') || t.status === 'In progress' || t.message.toLowerCase().includes('assign'));
  
  // "Internal notes"
  const internalNotes = timeline.filter(t => t.by === 'Warden' || t.by === 'Admin' || t.message.toLowerCase().includes('note'));

  const getStatusDotColor = (status) => {
    if (status === 'In progress') return 'bg-blue-500';
    if (status === 'Pending') return 'bg-yellow-400';
    return 'bg-purple-500';
  };

  const getStatusBadgeColors = (status) => {
    if (status === 'In progress') return 'bg-blue-50 text-blue-600';
    if (status === 'Pending') return 'bg-yellow-50 text-yellow-600';
    return 'bg-purple-50 text-purple-600';
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
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Complaint Information</h3>
            <p className="text-[11px] text-gray-500 mb-4">Basic Details about the complaint</p>
            <div className="space-y-1">
              <InfoRow label="Student">{complaint.student}</InfoRow>
              <InfoRow label="Hostel">{complaint.hostelName}</InfoRow>
              <InfoRow label="Category">{complaint.category}</InfoRow>
              <InfoRow label="Date">{complaint.date}</InfoRow>
              <InfoRow label="Priority">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {complaint.priority || 'High'}
                </span>
              </InfoRow>
              <InfoRow label="Status">
                <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-gray-700">
                  <span className={`w-2 h-2 rounded-full ${complaint.status === 'Pending' ? 'bg-yellow-400' : complaint.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  {complaint.status}
                </span>
              </InfoRow>
              <InfoRow label="Warden">Arjun Menon</InfoRow>
            </div>
          </div>

          {/* Complaint Description */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Complaint Description</h3>
            <p className="text-[11px] text-gray-500 mb-4">Review the issue reported by the student.</p>
            <div className="space-y-1">
              <InfoRow label="Subject">{complaint.subject}</InfoRow>
              <InfoRow label="Description">{complaint.description || "Food served during lunch was not fresh."}</InfoRow>
            </div>
          </div>

          {/* Internal note */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Internal note</h3>
                <p className="text-[11px] text-gray-500">Add a note by warden</p>
              </div>
              <button className="text-[11px] text-blue-600 hover:underline cursor-pointer">View all</button>
            </div>
            
            <div className="space-y-3">
              {internalNotes.length > 0 ? internalNotes.map((note, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm flex justify-between items-center">
                  <span className="text-[13px] text-gray-700">{note.message}</span>
                  <span className="text-[10px] text-gray-400">{new Date(note.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(note.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              )) : (
                <div className="text-[13px] text-gray-400 italic">No internal notes yet.</div>
              )}
            </div>
          </div>

          {/* Maintenance Assignment */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Maintenance Assignment</h3>
            <p className="text-[11px] text-gray-500 mb-4">Details of Maintenance Assignment</p>
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
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Staff Updates</h3>
                <p className="text-[11px] text-gray-500">Updates by the assigned maintenance staff</p>
              </div>
              <button 
                onClick={() => onOpenAssignStaff && onOpenAssignStaff(complaint)}
                className="px-4 py-1.5 text-[11px] font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Assign staff
              </button>
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
                        <span className="text-[10px] text-gray-400">{new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(update.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[12px] text-gray-700 mb-1">{update.message}</p>
                      <p className="text-[10px] text-gray-400">by {update.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-[13px] text-gray-400 italic">No staff updates yet.</div>
            )}
          </div>
        </div>

        {/* Right Column (1 part width) */}
        <div className="space-y-6">
          
          {/* Quick Summary */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Quick Summary</h3>
            <p className="text-[11px] text-gray-400 mb-4">Quick summary of the complaint</p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Student</span>
                <span className="font-medium text-gray-800">{complaint.student}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Category</span>
                <span className="font-medium text-gray-800">{complaint.category}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Date</span>
                <span className="font-medium text-gray-800">{complaint.date}</span>
              </div>
              <div className="flex justify-between text-[12px] items-center">
                <span className="text-gray-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Status</span>
                <span className="font-medium text-gray-800 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-yellow-400' : complaint.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  {complaint.status}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500 flex items-center gap-2"><Home className="w-3.5 h-3.5" /> Hostel</span>
                <span className="font-medium text-gray-800">{complaint.hostelName}</span>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Recent Updates</h3>
            <p className="text-[11px] text-gray-500 mb-4">Recent Updates about the complaint</p>
            
            <div className="space-y-3">
              {recentUpdates.map((update, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[12px] text-gray-700 leading-tight pr-4">{update.message}</span>
                    <span className="text-[9px] text-gray-400 whitespace-nowrap">{new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(update.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">by {update.by}</span>
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
