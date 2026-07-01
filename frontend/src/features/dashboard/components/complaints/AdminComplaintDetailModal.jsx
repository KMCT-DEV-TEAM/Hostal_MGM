import React from "react";
import Modal from "@/components/ui/Modal";
import { User, Calendar, Tag, Clock, Home, Info, MoreHorizontal, Bell } from "lucide-react";
import { showSuccessToast } from "@/utils/toast";
import SendNotificationModal from "./SendNotificationModal";
import { useState } from "react";

export default function AdminComplaintDetailModal({ complaint, onClose }) {
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [status, setStatus] = useState('In progress');
    const [note, setNote] = useState('Issue verified and food quality improved.');
    const [internalNoteText, setInternalNoteText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAllNotes, setShowAllNotes] = useState(false);
    const [showAllActivities, setShowAllActivities] = useState(false);

    const handleAddInternalNote = async () => {
        if (!internalNoteText.trim()) {
            showSuccessToast("Validation", "Please provide a note text."); // Using success toast as error for simplicity based on imports
            return;
        }
        setIsProcessing(true);
        try {
            // Using a mock API call since ComplaintService isn't imported
            // In a real scenario we'd import and use ComplaintService.addInternalNote
            console.log("Adding internal note", internalNoteText);
            showSuccessToast('Success', 'Internal note added successfully.');
            setInternalNoteText('');
        } catch (error) {
            console.error("Error", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!complaint) return null;

    const timeline = complaint.timeline || [];
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

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            maxWidth="max-w-5xl"
            title="Complaint Details"
            subtitle={`${complaint.student} - ${complaint.id || 'A1007'}`}
            icon={<User size={24} />}
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
                                <span className="text-text-secondary">Student</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.student}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Hostel</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.hostel}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Category</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.category}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Date</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.date || "12 June 2026"}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm items-center">
                                <span className="text-text-secondary">Priority</span>
                                <span className="col-span-2 font-medium text-text-secondary flex items-center gap-2">
                                    : &nbsp;
                                    <span className={`w-1.5 h-1.5 rounded-full ${complaint.priority === 'High' ? 'bg-danger' : complaint.priority === 'Medium' ? 'bg-warning' : 'bg-gray-400'}`}></span>
                                    {complaint.priority || "High"}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 text-sm items-center">
                                <span className="text-text-secondary">Status</span>
                                <span className="col-span-2 font-medium text-text-secondary flex items-center gap-2">
                                    : &nbsp;
                                    <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-warning' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Incomplete' ? 'bg-primary' : 'bg-blue-500'}`}></span>
                                    {complaint.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Warden</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; Arjun Menon</span>
                            </div>
                        </div>
                    </div>

                    {/* Complaint Description */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#0A437A]">Complaint Description</h3>
                            <p className="text-xs text-text-secondary">Review the issue reported by the student.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Subject</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.subject || "Poor food quality"}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary">Description</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.description || "Food served during lunch was not fresh."}</span>
                            </div>
                        </div>
                    </div>

                    {/* Internal note */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4 flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-semibold text-[#0A437A]">Internal note</h3>
                                <p className="text-xs text-text-secondary">Add a note visible to Admins and Wardens</p>
                            </div>
                            {internalNotes.length > 5 && (
                                <button onClick={() => setShowAllNotes(!showAllNotes)} className="text-secondary text-xs cursor-pointer hover:underline">
                                    {showAllNotes ? 'View less' : 'View all'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-3 mb-4">
                            {(showAllNotes ? internalNotes : internalNotes.slice(0, 5)).length > 0 ? (showAllNotes ? internalNotes : internalNotes.slice(0, 5)).map((n, idx) => (
                                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[13px] text-gray-700">{n.note}</span>
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
                                value={internalNoteText}
                                onChange={(e) => setInternalNoteText(e.target.value)}
                                placeholder="Type your note here..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0A437A]"
                            />
                            <button
                                onClick={handleAddInternalNote}
                                disabled={isProcessing || !internalNoteText.trim()}
                                className="px-4 py-2 bg-[#0A437A] text-white rounded-md text-sm font-medium hover:bg-[#0A437A]/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Resolution note */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-[#0A437A]">Resolution note</h3>
                                <p className="text-xs text-text-secondary">updated status and notes</p>
                            </div>
                            {isEditingStatus ? (
                                <button
                                    onClick={() => {
                                        setIsEditingStatus(false);
                                        showSuccessToast("Status Updated", "Resolution note saved successfully");
                                    }}
                                    className="px-4 py-1.5 text-xs font-medium text-white bg-success rounded-md hover:bg-success/90 transition-colors shadow-sm cursor-pointer"
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditingStatus(true)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#0A437A] rounded-md hover:bg-[#0A437A]/90 transition-colors shadow-sm cursor-pointer"
                                >
                                    Update Status
                                </button>
                            )}
                        </div>

                        {isEditingStatus ? (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#0A437A] cursor-pointer"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In progress">In progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0A437A] min-h-[80px]"
                                    placeholder="Add resolution note..."
                                ></textarea>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border ${status === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : status === 'Resolved' ? 'bg-success/10 text-success border-success/20' : status === 'Incomplete' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-blue-50 text-secondary border-blue-100'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Pending' ? 'bg-warning' : status === 'Resolved' ? 'bg-success' : status === 'Incomplete' ? 'bg-primary' : 'bg-secondary'}`}></span>
                                        {status}
                                    </span>
                                </div>
                                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm text-text-secondary">{note || "No resolution note provided."}</span>
                                        <span className="text-xs text-text-secondary">Today - 09:00 am</span>
                                    </div>
                                    <span className="text-[10px] text-text-secondary">by Admin</span>
                                </div>
                            </>
                        )}
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
                                <span className="text-text-secondary flex items-center gap-2"><User className="w-4 h-4" /> Student</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.student}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary flex items-center gap-2"><Tag className="w-4 h-4" /> Category</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.category}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.date || "12 June 2026"}</span>
                            </div>
                            <div className="grid grid-cols-3 text-sm items-center">
                                <span className="text-text-secondary flex items-center gap-2"><Clock className="w-4 h-4" /> Status</span>
                                <span className="col-span-2 font-medium text-text-secondary flex items-center gap-2">
                                    : &nbsp;
                                    <span className={`w-1.5 h-1.5 rounded-full ${complaint.status === 'Pending' ? 'bg-warning' : complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'Incomplete' ? 'bg-primary' : 'bg-blue-500'}`}></span>
                                    {complaint.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-text-secondary flex items-center gap-2"><Home className="w-4 h-4" /> Hostel</span>
                                <span className="col-span-2 font-medium text-text-secondary">: &nbsp; {complaint.hostel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4 border-b border-gray-100 pb-4 flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-semibold text-[#0A437A]">Recent Activity</h3>
                                <p className="text-xs text-text-secondary">Recent activities about the complaint</p>
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
                                <div className="text-[13px] text-text-secondary italic">No recent activities available.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#0A437A] text-white rounded-md text-sm font-medium hover:bg-[#0A437A]/90 transition-colors cursor-pointer"
                >
                    <Bell className="w-4 h-4" /> Notify Admin
                </button>
            </div>

            <SendNotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                recipient="Admin"
                onSend={(message) => {
                    console.log("Sending notification:", message);
                    setIsNotificationModalOpen(false);
                    showSuccessToast("Notification Sent", "Admin has been notified about this complaint.");
                    onClose();
                }}
            />
        </Modal>
    );
}
