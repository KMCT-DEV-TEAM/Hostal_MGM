import React from 'react';
import { X, User, Mail, Phone, Building2, Activity, Fingerprint, Pencil } from 'lucide-react';

const AdminDetailView = ({ selectedAdminDetail, setView, openChangeEmailModal }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                    <div className="md:col-span-2 space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                            <p className="text-xs text-gray-400 mb-6">Basic contact information of the Administrator</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Name</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail?.name}</span></div>

                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                    <span className="text-gray-500 flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> Email</span>
                                    <span className="sm:col-span-2 font-medium text-gray-900 flex items-center justify-between"><span className="hidden sm:inline">: </span>
                                        <span className="flex-1">{selectedAdminDetail?.email || 'N/A'}</span>
                                        <button
                                            onClick={() => openChangeEmailModal && openChangeEmailModal(selectedAdminDetail)}
                                            className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer ml-4"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </span>
                                </div>

                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail?.phone ? `+91 ${selectedAdminDetail.phone}` : 'N/A'}</span></div>

                            </div>
                        </div>
                        {/* Organization Info Section */}
                        {selectedAdminDetail?.organization && typeof selectedAdminDetail.organization === 'object' && selectedAdminDetail.organization.name && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-primary mb-1">Organization Details</h3>
                                <p className="text-xs text-gray-400 mb-6">Assigned organization for this administrator</p>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Organization Name</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail.organization.name}</span></div>

                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-gray-400" /> Code</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail.organization.code || 'N/A'}</span></div>

                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-gray-400" /> Registration No</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail.organization.organisationNumber || 'N/A'}</span></div>

                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> Email</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail.organization.email || 'N/A'}</span></div>

                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail.organization.phone ? `+91 ${selectedAdminDetail.organization.phone}` : 'N/A'}</span></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-primary mb-4">Admin Summary</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Name</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail?.name}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Organization</span> <span className="sm:col-span-2 font-medium text-gray-900"><span className="hidden sm:inline">: </span>{selectedAdminDetail?.organization?.name || selectedAdminDetail?.organization || 'N/A'}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                <span className="text-gray-500 flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-400" /> Status</span>
                                <span className="sm:col-span-2 font-medium text-gray-900 flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                    <span className={`w-2 h-2 rounded-full ${selectedAdminDetail?.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                    {selectedAdminDetail?.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default AdminDetailView;
