import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Calendar, Tag, Clock, Home, MessageSquare } from "lucide-react";

export default function StudentComplaintDetailModal({ complaint, onClose }) {
    const [showAllActivities, setShowAllActivities] = useState(false);

    if (!complaint) return null;

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={true}
            onClose={onClose}
            maxWidth="max-w-5xl"
            title="Complaint Details"
            subtitle={`${complaint.category} - ${complaint.subject}`}
            icon={<MessageSquare size={24} />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Wider) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Complaint Information */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#0A437A]">Complaint Information</h3>
                            <p className="text-xs text-text-secondary">Basic Details about the complaint</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Category</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.category || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Hostel</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.hostelName || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Room No</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.roomNo || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Date</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.date || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm items-center">
                                <span className="text-text-secondary">Priority</span>
                                <span className="col-span-2 font-medium text-text-secondary flex items-center gap-2">
                                    : &nbsp;
                                    <span className={`w-1.5 h-1.5 rounded-full ${complaint.priority === 'High' ? 'bg-danger' : complaint.priority === 'Low' ? 'bg-success' : 'bg-warning'}`}></span>
                                    {complaint.priority || "Medium"}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 text-sm items-center">
                                <span className="text-text-secondary">Status</span>
                                <span className="col-span-2 font-medium text-text-secondary flex items-center gap-2">
                                    : &nbsp;
                                    <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-warning' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Incomplete' ? 'bg-primary' : 'bg-blue-500'}`}></span>
                                    {complaint.status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Complaint Description */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#0A437A]">Complaint Description</h3>
                            <p className="text-xs text-text-secondary">Review the issue you reported.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Subject</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.subject || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Description</span>
                                <span className="col-span-2 font-medium text-text-secondary leading-relaxed">
                                    : &nbsp; {complaint.description || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Resolution Details */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-[#0A437A]">Resolution Details</h3>
                                <p className="text-xs text-text-secondary">Details of how the complaint was resolved</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {complaint.status === 'Resolved' && (complaint.resolutionNotes || complaint.materialsUsed) ? (
                                <>
                                    {complaint.resolutionNotes && (
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-text-secondary">Notes</span>
                                            <span className="col-span-2 font-medium text-text-secondary leading-relaxed">: &nbsp; {complaint.resolutionNotes}</span>
                                        </div>
                                    )}
                                    {complaint.materialsUsed && (
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-text-secondary">Materials</span>
                                            <span className="col-span-2 font-medium text-text-secondary leading-relaxed">: &nbsp; {complaint.materialsUsed}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-[13px] font-semibold text-danger italic">Not resolved yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Quick Summary */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4 border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-semibold text-[#0A437A]">Quick Summary</h3>
                            <p className="text-xs text-text-secondary">Quick summary of the complaint</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary flex items-center gap-2"><Tag className="w-4 h-4" /> Category</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.category || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.date || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm items-center">
                                <span className="text-text-secondary flex items-center gap-2"><Clock className="w-4 h-4" /> Status</span>
                                <span className="col-span-2 font-medium text-text-secondary flex items-center gap-2">
                                    : &nbsp;
                                    <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-warning' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Incomplete' ? 'bg-primary' : 'bg-blue-500'}`}></span>
                                    {complaint.status || 'Pending'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary flex items-center gap-2"><Home className="w-4 h-4" /> Hostel</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.hostelName || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Logs */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4 border-b border-gray-100 pb-4 flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-semibold text-[#0A437A]">Activity Logs</h3>
                                <p className="text-xs text-text-secondary">Recent updates about your complaint</p>
                            </div>
                            {complaint.timeline && complaint.timeline.length > 5 && (
                                <button onClick={() => setShowAllActivities(!showAllActivities)} className="text-secondary text-xs cursor-pointer hover:underline">
                                    {showAllActivities ? 'View less' : 'View all'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {complaint.timeline && complaint.timeline.length > 0 ? (
                                (showAllActivities ? [...complaint.timeline].reverse() : [...complaint.timeline].reverse().slice(0, 5)).map((update, idx) => (
                                    <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-[13px] text-gray-700 leading-relaxed">{update.message}</span>
                                            <span className="text-[11px] text-gray-400 whitespace-nowrap pt-0.5">
                                                {new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(update.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                                            </span>
                                        </div>
                                        <span className="text-[12px] text-gray-400">by {update.by}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[13px] text-text-secondary italic">No activity logs available.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </Modal>
    );
}
