import React from 'react';
import { X, User } from 'lucide-react';

const AdminDetailView = ({ selectedAdminDetail, setView }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={() => setView('list')}
                    className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <X size={14} />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-[#0A437A] rounded-lg flex items-center justify-center text-white">
                            <User size={18} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedAdminDetail?.name}</h1>
                    </div>
                    <p className="text-gray-400 text-sm ml-11">Administrator Details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Main Content Area */}
                    <div className="md:col-span-2 space-y-4">
                        {/* Basic Info Section */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-semibold text-primary mb-4">Basic Info</h3>
                            <p className="text-xs text-gray-400 mb-6">Basic contact information of the Administrator</p>
                            <div className="grid grid-cols-2 gap-y-4">
                                <div className="text-sm"><span className="text-gray-500">Name</span></div>
                                <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail?.name}</div>

                                <div className="text-sm"><span className="text-gray-500">Email</span></div>
                                <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail?.email || 'N/A'}</div>

                                <div className="text-sm"><span className="text-gray-500">Phone Number</span></div>
                                <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail?.phone ? `+91 ${selectedAdminDetail.phone}` : 'N/A'}</div>

                                <div className="text-sm"><span className="text-gray-500">Organization</span></div>
                                <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail?.organization?.name || selectedAdminDetail?.organization || 'N/A'}</div>

                                <div className="text-sm"><span className="text-gray-500">Status</span></div>
                                <div className="flex items-center text-sm font-medium text-gray-900">
                                    : <span className="ml-2 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${selectedAdminDetail?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>{selectedAdminDetail?.isActive ? "Active" : "Inactive"}</span>
                                </div>
                            </div>
                        </div>
                        {/* Organization Info Section */}
                        {selectedAdminDetail?.organization && typeof selectedAdminDetail.organization === 'object' && selectedAdminDetail.organization.name && (
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <h3 className="text-lg font-semibold text-primary mb-4">Organization Details</h3>
                                <p className="text-xs text-gray-400 mb-6">Assigned organization for this administrator</p>
                                <div className="grid grid-cols-2 gap-y-4">
                                    <div className="text-sm"><span className="text-gray-500">Organization Name</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail.organization.name}</div>

                                    <div className="text-sm"><span className="text-gray-500">Code</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail.organization.code || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Registration Number</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail.organization.organisationNumber || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Email</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail.organization.email || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Phone Number</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedAdminDetail.organization.phone ? `+91 ${selectedAdminDetail.organization.phone}` : 'N/A'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 h-fit">
                        <h3 className="text-lg font-semibold text-primary mb-6">Admin Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span> <span className="font-medium text-gray-900">{selectedAdminDetail?.name}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Organization</span> <span className="font-medium text-gray-900">{selectedAdminDetail?.organization?.name || selectedAdminDetail?.organization || 'N/A'}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span> <span className="font-medium text-gray-900 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${selectedAdminDetail?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>{selectedAdminDetail?.isActive ? "Active" : "Inactive"}</span></div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default AdminDetailView;
