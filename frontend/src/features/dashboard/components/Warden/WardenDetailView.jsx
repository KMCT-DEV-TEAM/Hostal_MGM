import React, { useState, useEffect } from 'react';
import { X, User, Pencil, Activity, Calendar, Clock, Phone, Mail, Building2, Loader2, Hash, Home, Users, MapPin } from 'lucide-react';
import hostelService from '@/services/hostel.service';

export default function WardenDetailView({ selectedWardenDetail, setView, openChangeEmailModal }) {
    const [hostelDetails, setHostelDetails] = useState(null);
    const [loadingHostel, setLoadingHostel] = useState(false);

    useEffect(() => {
        const fetchHostelDetails = async () => {
            const hostelId = typeof selectedWardenDetail?.hostel === 'object' 
                ? selectedWardenDetail?.hostel?._id 
                : selectedWardenDetail?.hostel;
            
            if (!hostelId || hostelId === 'Not Assigned') return;

            setLoadingHostel(true);
            try {
                const res = await hostelService.getHostelById(hostelId);
                if (res && res.data) {
                    setHostelDetails(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch hostel details:", error);
            } finally {
                setLoadingHostel(false);
            }
        };

        fetchHostelDetails();
    }, [selectedWardenDetail]);

    if (!selectedWardenDetail) return null;

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
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                            <User size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedWardenDetail?.name}</h1>
                            <p className="text-gray-400 text-sm">Warden Details</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                            <p className="text-xs text-gray-400 mb-6">Basic information of the Warden</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail?.name}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail?.phone ? `${selectedWardenDetail.phone}` : 'N/A'}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                    <span className="text-gray-500 flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> Email</span>
                                    <span className="sm:col-span-2 font-medium flex items-center justify-between"><span className="hidden sm:inline">: </span>
                                        <span className="flex-1">{selectedWardenDetail?.email || 'N/A'}</span>
                                        <button
                                            onClick={() => openChangeEmailModal(selectedWardenDetail)}
                                            className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer ml-4"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>




                        {/* Hostel Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-1">Hostel Details</h3>
                            <p className="text-xs text-gray-400 mb-6">Details of assigned hostel</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-3 items-start sm:items-center">
                                    <span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Hostel</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail?.hostel?.name || selectedWardenDetail?.hostel || 'N/A'}</span>
                                    
                                    {loadingHostel ? (
                                        <div className="sm:col-span-3 flex justify-center py-2">
                                            <Loader2 className="w-5 h-5 text-[#0A437A] animate-spin" />
                                        </div>
                                    ) : hostelDetails ? (
                                        <>
                                            <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Hash className="w-4 h-4 text-gray-400" /> Code</span>
                                            <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{hostelDetails.code || 'N/A'}</span>

                                            <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Home className="w-4 h-4 text-gray-400" /> Type</span>
                                            <span className="sm:col-span-2 font-medium capitalize"><span className="hidden sm:inline">: </span>{hostelDetails.hosteltype || 'N/A'}</span>

                                            <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Users className="w-4 h-4 text-gray-400" /> Capacity</span>
                                            <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{hostelDetails.capacity || 'N/A'}</span>

                                            <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><MapPin className="w-4 h-4 text-gray-400" /> Location</span>
                                            <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{hostelDetails.location || 'N/A'}</span>
                                        </>
                                    ) : (
                                        typeof selectedWardenDetail?.hostel === 'object' && selectedWardenDetail?.hostel !== null && (
                                            <>
                                                <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Hash className="w-4 h-4 text-gray-400" /> Code</span>
                                                <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail.hostel.code || 'N/A'}</span>

                                                <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Home className="w-4 h-4 text-gray-400" /> Type</span>
                                                <span className="sm:col-span-2 font-medium capitalize"><span className="hidden sm:inline">: </span>{selectedWardenDetail.hostel.hosteltype || 'N/A'}</span>

                                                <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Users className="w-4 h-4 text-gray-400" /> Capacity</span>
                                                <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail.hostel.capacity || 'N/A'}</span>

                                                <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><MapPin className="w-4 h-4 text-gray-400" /> Location</span>
                                                <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail.hostel.location || 'N/A'}</span>
                                            </>
                                        )
                                    )}

                                    <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Activity className="w-4 h-4 text-gray-400" /> Status</span>
                                    <span className="sm:col-span-2 font-medium flex items-center mt-2 sm:mt-0"><span className="hidden sm:inline mr-2">: </span>
                                        <span className={`w-2 h-2 rounded-full ${selectedWardenDetail?.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                        {selectedWardenDetail?.status}
                                    </span>
                                    <span className="text-gray-500 flex items-center gap-1.5 mt-2 sm:mt-0"><Calendar className="w-4 h-4 text-gray-400" /> Created On</span>
                                    <span className="sm:col-span-2 font-medium mt-2 sm:mt-0"><span className="hidden sm:inline mr-2">: </span>{selectedWardenDetail?.createdAt ? new Date(selectedWardenDetail.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-primary mb-4">Warden Summary</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail?.name}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Hostel</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedWardenDetail?.hostel?.name || selectedWardenDetail?.hostel || 'N/A'}</span></div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                <span className="text-gray-500 flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-400" /> Status</span>
                                <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                    <span className={`w-2 h-2 rounded-full ${selectedWardenDetail?.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                    {selectedWardenDetail?.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
