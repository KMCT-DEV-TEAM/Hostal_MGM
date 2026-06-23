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
    <span className="text-gray-500 flex items-start gap-1.5 pt-0.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      {label}
    </span>
    <span className="sm:col-span-2 font-medium text-gray-900 leading-relaxed">
      <span className="hidden sm:inline">: </span>
      {children}
    </span>
  </div>
);

const WardenComplaintDetailView = ({ complaint, onClose }) => {
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
            <h3 className="text-lg font-semibold text-[#0A437A] mb-1">
              Complaint Information
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Detailed description of the reported issue
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<FileText className="w-4 h-4 text-gray-400" />}
                label="Subject"
              >
                {complaint.subject || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Tag className="w-4 h-4 text-gray-400" />}
                label="Category"
              >
                {complaint.category || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<MessageSquare className="w-4 h-4 text-gray-400" />}
                label="Description"
              >
                {complaint.description || "The student has reported an issue regarding " + (complaint.category?.toLowerCase() || 'the hostel') + ". Please review the details and take necessary action to resolve it promptly."}
              </InfoRow>
              <InfoRow
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label="Reported Date"
              >
                {complaint.date || "N/A"}
              </InfoRow>
            </div>
          </div>

          {/* Location & Status Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0A437A] mb-1">
              Location & Status
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Room assignment and current resolution status
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<Home className="w-4 h-4 text-gray-400" />}
                label="Room No"
              >
                {complaint.roomNo || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<AlertCircle className="w-4 h-4 text-gray-400" />}
                label="Priority"
              >
                <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${complaint.priority === 'High' ? 'bg-red-50 text-red-500' : complaint.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-600'}`}>
                  {complaint.priority || 'Low'}
                </span>
              </InfoRow>
              <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Status
                </span>
                <span className="sm:col-span-2 font-medium text-gray-900 flex items-center gap-2">
                  <span className="hidden sm:inline">: </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-orange-50 text-orange-400' : complaint.status === 'Resolved' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                    {complaint.status || "N/A"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="bg-white p-5 col-span-2 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#0A437A]" />
            <h3 className="text-lg font-semibold text-[#0A437A]">
              Quick Summary
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" /> Student
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {complaint.student || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-gray-400" /> Room No
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {complaint.roomNo || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-gray-400" /> Category
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {complaint.category || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" /> Date
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900 break-words">
                <span className="hidden sm:inline">: </span>
                {complaint.date || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-gray-400" /> Priority
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${complaint.priority === 'High' ? 'bg-red-50 text-red-500' : complaint.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-600'}`}>
                  {complaint.priority || 'Low'}
                </span>
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> Status
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-orange-50 text-orange-400' : complaint.status === 'Resolved' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
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
