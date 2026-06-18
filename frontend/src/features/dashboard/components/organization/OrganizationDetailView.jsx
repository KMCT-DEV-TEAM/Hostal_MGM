import React from 'react';
import { X, Building2, Fingerprint, Activity, MapPin, Phone, Mail } from 'lucide-react';

const OrganizationDetailView = ({ selectedOrganizationDetail, setView }) => {
    if (!selectedOrganizationDetail) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Close Button */}
                <button
                    onClick={() => setView('list')}
                    className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                    <X size={14} />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedOrganizationDetail.name}</h1>
                            <p className="text-gray-400 text-sm">Organization - {selectedOrganizationDetail.hostelCount || 0} Hostels</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                            <p className="text-xs text-gray-400 mb-6">Basic contact information of the Organization</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-gray-400" /> Organization Id</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.code}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Organization Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.name}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-center">
                                    <span className="text-gray-500 flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-400" /> Status</span> 
                                    <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                        <span className={`w-2 h-2 rounded-full ${selectedOrganizationDetail.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                        {selectedOrganizationDetail.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Address Information</h3>
                            <p className="text-xs text-gray-400 mb-6">Address information of the Organization</p>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> Full Address</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.address}</span></div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Contact Information</h3>
                            <p className="text-xs text-gray-400 mb-6">Contact information of the Organization</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-[#777777] flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone No</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.phone}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-[#777777] flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> Email</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.email}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-primary mb-4">Organization Summary</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-[#777777] flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-gray-400" /> Organization Id</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.code}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-[#777777] flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Organization Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.name}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-center">
                                <span className="text-[#777777] flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-400" /> Status</span> 
                                <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                    <span className={`w-2 h-2 rounded-full ${selectedOrganizationDetail.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                    {selectedOrganizationDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-[#777777] flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone No</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.phone}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-[#777777] flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> Email</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedOrganizationDetail.email}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationDetailView;
