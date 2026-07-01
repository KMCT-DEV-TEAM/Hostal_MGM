import React, { useState, useEffect } from 'react';
import { X, User, Pencil, ToggleRight, Calendar, Clock, Phone, Mail, Building2, Loader2, Hash, Home, Users, MapPin } from 'lucide-react';
import hostelService from '@/services/hostel.service';
import InfoRow from '@/components/ui/InfoRow';

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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 md:p-8 shadow-2xl border border-gray-100 relative max-h-[95vh] sm:max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic information of the Warden</p>
                            <div className="space-y-1">
                                <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedWardenDetail?.name}</InfoRow>
                                <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedWardenDetail?.phone ? `${selectedWardenDetail.phone}` : 'N/A'}</InfoRow>
                                <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>
                                    <span className="flex items-center justify-between">
                                        <span className="flex-1 break-all">{selectedWardenDetail?.email || 'N/A'}</span>
                                        <button
                                            onClick={() => openChangeEmailModal(selectedWardenDetail)}
                                            className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer ml-4"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </span>
                                </InfoRow>
                            </div>
                        </div>




                        {/* Hostel Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Hostel Details</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Details of assigned hostel</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Hostel</>}>{selectedWardenDetail?.hostel?.name || selectedWardenDetail?.hostel || 'N/A'}</InfoRow>
                                
                                {loadingHostel ? (
                                    <div className="py-2">
                                        <Loader2 className="w-5 h-5 text-[#0A437A] animate-spin mx-auto" />
                                    </div>
                                ) : hostelDetails ? (
                                    <>
                                        <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{hostelDetails.code || 'N/A'}</InfoRow>
                                        <InfoRow label={<><Home className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{hostelDetails.hosteltype || 'N/A'}</span></InfoRow>
                                        <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{hostelDetails.capacity || 'N/A'}</InfoRow>
                                        <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Location</>}>{hostelDetails.location || 'N/A'}</InfoRow>
                                    </>
                                ) : (
                                    typeof selectedWardenDetail?.hostel === 'object' && selectedWardenDetail?.hostel !== null && (
                                        <>
                                            <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{selectedWardenDetail.hostel.code || 'N/A'}</InfoRow>
                                            <InfoRow label={<><Home className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{selectedWardenDetail.hostel.hosteltype || 'N/A'}</span></InfoRow>
                                            <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{selectedWardenDetail.hostel.capacity || 'N/A'}</InfoRow>
                                            <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Location</>}>{selectedWardenDetail.hostel.location || 'N/A'}</InfoRow>
                                        </>
                                    )
                                )}

                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${selectedWardenDetail?.status === 'Active' ? 'bg-green-600' : 'bg-red-600'} mr-2`}></span>
                                        {selectedWardenDetail?.status}
                                    </span>
                                </InfoRow>
                                <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created</>}>{selectedWardenDetail?.createdAt ? new Date(selectedWardenDetail.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                            </div>
                        </div>

                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Warden Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedWardenDetail?.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Hostel</>}>{selectedWardenDetail?.hostel?.name || selectedWardenDetail?.hostel || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedWardenDetail?.status === 'Active' ? 'bg-green-600' : 'bg-red-600'} mr-2`}></span>
                                    {selectedWardenDetail?.status}
                                </span>
                            </InfoRow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
