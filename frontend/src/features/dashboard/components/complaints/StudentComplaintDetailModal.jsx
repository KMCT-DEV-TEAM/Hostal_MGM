import React from 'react';
import { X, MessageSquare, Calendar, AlertCircle, Clock, Hash, Tag, FileText, ToggleRight, LayoutGrid } from 'lucide-react';

export default function StudentComplaintDetailModal({ complaint, onClose }) {
    if (!complaint) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-text-secondary hover:text-text-secondary hover:bg-gray-50 cursor-pointer"
                >
                    <X size={14} />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">Complaint Details</h1>
                            <p className="text-text-secondary text-sm">{complaint.category} - {complaint.subject}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Complaint Information</h3>
                            <p className="text-xs text-text-secondary mb-6">Basic Details about the complaint</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                    <span className="text-text-secondary flex items-center gap-1.5"><LayoutGrid className="w-4 h-4 text-text-secondary" /> Category</span> 
                                    <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{complaint.category || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                    <span className="text-text-secondary flex items-center gap-1.5"><Calendar className="w-4 h-4 text-text-secondary" /> Date</span> 
                                    <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{complaint.date || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                    <span className="text-text-secondary flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-text-secondary" /> Priority</span> 
                                    <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                        <span className={`w-2 h-2 rounded-full bg-danger mr-2`}></span>
                                        High
                                    </span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                    <span className="text-text-secondary flex items-center gap-1.5"><ToggleRight className="w-4 h-4 text-text-secondary" /> Status</span> 
                                    <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                        <span className={`w-2 h-2 rounded-full ${complaint.status === 'Resolved' ? 'bg-success/100' : complaint.status === 'In progress' ? 'bg-blue-500' : 'bg-warning'} mr-2`}></span>
                                        {complaint.status || 'Pending'}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                    <span className="text-text-secondary flex items-center gap-1.5"><Hash className="w-4 h-4 text-text-secondary" /> Room No</span> 
                                    <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{complaint.roomNo || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Complaint Description */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Complaint Description</h3>
                            <p className="text-xs text-text-secondary mb-6">Add brief description about complaint</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start">
                                    <span className="text-text-secondary flex items-center gap-1.5"><Tag className="w-4 h-4 text-text-secondary" /> Subject</span> 
                                    <span className="sm:col-span-2 font-medium leading-relaxed"><span className="hidden sm:inline">: </span>{complaint.subject || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start mt-4">
                                    <span className="text-text-secondary flex items-center gap-1.5 mt-0.5"><FileText className="w-4 h-4 text-text-secondary" /> Description</span> 
                                    <span className="sm:col-span-2 font-medium leading-relaxed">
                                        <span className="hidden sm:inline">: </span>
                                        <span className="block sm:inline">{complaint.description || 'N/A'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Resolution Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Resolution Details</h3>
                            <p className="text-xs text-text-secondary mb-6">Details of how the complaint was resolved</p>
                            <div className="space-y-4">
                                {complaint.status === 'Resolved' && (complaint.resolutionNotes || complaint.materialsUsed) ? (
                                    <>
                                        {complaint.resolutionNotes && (
                                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start">
                                                <span className="text-text-secondary flex items-center gap-1.5"><FileText className="w-4 h-4 text-text-secondary" /> Notes</span> 
                                                <span className="sm:col-span-2 font-medium leading-relaxed"><span className="hidden sm:inline">: </span>{complaint.resolutionNotes}</span>
                                            </div>
                                        )}
                                        {complaint.materialsUsed && (
                                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start mt-4">
                                                <span className="text-text-secondary flex items-center gap-1.5"><Tag className="w-4 h-4 text-text-secondary" /> Materials</span> 
                                                <span className="sm:col-span-2 font-medium leading-relaxed"><span className="hidden sm:inline">: </span>{complaint.materialsUsed}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-[13px] text-text-secondary italic font-semibold text-danger">Not resolved yet</div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-primary mb-4">Quick Summary</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                <span className="text-text-secondary flex items-center gap-1.5"><LayoutGrid className="w-4 h-4 text-text-secondary" /> Category</span> 
                                <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{complaint.category || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                <span className="text-text-secondary flex items-center gap-1.5"><Calendar className="w-4 h-4 text-text-secondary" /> Date</span> 
                                <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{complaint.date || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                <span className="text-text-secondary flex items-center gap-1.5"><ToggleRight className="w-4 h-4 text-text-secondary" /> Status</span> 
                                <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                    <span className={`w-2 h-2 rounded-full ${complaint.status === 'Resolved' ? 'bg-success/100' : complaint.status === 'In progress' ? 'bg-blue-500' : 'bg-warning'} mr-2`}></span>
                                    {complaint.status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
