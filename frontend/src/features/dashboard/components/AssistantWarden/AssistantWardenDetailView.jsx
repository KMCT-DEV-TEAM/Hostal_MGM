import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, ToggleRight, Pencil, Hash, Home, Users, MapPin, Calendar, Loader2 } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

const AssistantWardenDetailView = ({ selectedAssistantWardenDetail, setView, openChangeEmailModal }) => {
    const [hostelDetails, setHostelDetails] = useState(null);
    const [loadingHostel, setLoadingHostel] = useState(false);

    useEffect(() => {
        if (selectedAssistantWardenDetail && selectedAssistantWardenDetail.hostel) {
            const hostelId = typeof selectedAssistantWardenDetail.hostel === 'object' ? selectedAssistantWardenDetail.hostel.id : selectedAssistantWardenDetail.hostel;
            if (hostelId && hostelId !== 'Not Assigned') {
                const fetchHostel = async () => {
                    setLoadingHostel(true);
                    try {
                        const res = await hostelService.getHostelById(hostelId);
                        if (res && res.data) setHostelDetails(res.data);
                    } catch (err) {
                        console.error('Failed to fetch hostel details for assistantWarden:', err);
                    } finally {
                        setLoadingHostel(false);
                    }
                };
                fetchHostel();
            }
        }
    }, [selectedAssistantWardenDetail]);

    return (
        <Modal
            bottomSheetOnMobile={true}
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedAssistantWardenDetail?.name || 'AssistantWarden'}
            subtitle="AssistantWarden Details"
            icon={<User size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-4 md:space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic information of the AssistantWarden</p>
                        <div className="space-y-1">
                            <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedAssistantWardenDetail?.name}</InfoRow>
                            <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedAssistantWardenDetail?.phone ? `+91 ${selectedAssistantWardenDetail.phone}` : 'N/A'}</InfoRow>
                            <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>
                                <span className="flex items-center justify-between w-full">
                                    <span className="flex-1 break-all pr-2">{selectedAssistantWardenDetail?.email || 'N/A'}</span>
                                    <button
                                        onClick={() => openChangeEmailModal && openChangeEmailModal(selectedAssistantWardenDetail)}
                                        className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer shrink-0"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </span>
                            </InfoRow>
                        </div>
                    </div>

                    {/* Hostel Details */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Hostel Details</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Details of assigned hostel</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Hostel</>}>{selectedAssistantWardenDetail?.hostel?.name || selectedAssistantWardenDetail?.hostel || 'N/A'}</InfoRow>

                            {loadingHostel ? (
                                <div className="space-y-4 animate-pulse mt-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                            <div className="flex items-center gap-2 w-1/3">
                                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                            </div>
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : hostelDetails ? (
                                <>
                                    <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{hostelDetails.code || 'N/A'}</InfoRow>
                                    <InfoRow label={<><Home className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{hostelDetails.hosteltype || 'N/A'}</span></InfoRow>
                                    <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{hostelDetails.capacity || 'N/A'}</InfoRow>
                                    <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Location</>}>{hostelDetails.location || 'N/A'}</InfoRow>
                                </>
                            ) : (
                                typeof selectedAssistantWardenDetail?.hostel === 'object' && selectedAssistantWardenDetail?.hostel !== null && (
                                    <>
                                        <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{selectedAssistantWardenDetail.hostel.code || 'N/A'}</InfoRow>
                                        <InfoRow label={<><Home className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{selectedAssistantWardenDetail.hostel.hosteltype || 'N/A'}</span></InfoRow>
                                        <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{selectedAssistantWardenDetail.hostel.capacity || 'N/A'}</InfoRow>
                                        <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Location</>}>{selectedAssistantWardenDetail.hostel.location || 'N/A'}</InfoRow>
                                    </>
                                )
                            )}

                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedAssistantWardenDetail?.status === 'Active' ? 'bg-green-600' : 'bg-red-600'} mr-2`}></span>
                                    {selectedAssistantWardenDetail?.status}
                                </span>
                            </InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created</>}>{selectedAssistantWardenDetail?.createdAt ? new Date(selectedAssistantWardenDetail.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">AssistantWarden Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedAssistantWardenDetail?.name}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Hostel</>}>{selectedAssistantWardenDetail?.hostel?.name || selectedAssistantWardenDetail?.hostel || 'N/A'}</InfoRow>
                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${selectedAssistantWardenDetail?.status === 'Active' ? 'bg-green-600' : 'bg-red-600'} mr-2`}></span>
                                {selectedAssistantWardenDetail?.status}
                            </span>
                        </InfoRow>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AssistantWardenDetailView;
