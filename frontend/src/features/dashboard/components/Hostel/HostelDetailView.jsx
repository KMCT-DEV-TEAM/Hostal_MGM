
import React from 'react';
import { Home, Mail, Phone, Users, MapPin, Hash, Building2, ToggleRight } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

const HostelDetailView = ({ selectedHostelDetail, setView }) => {
    if (!selectedHostelDetail) return null;

    return (
        <Modal 
            bottomSheetOnMobile={true}
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedHostelDetail.name}
            subtitle={`Hostel - ${selectedHostelDetail.studentsCount || 0} Students`}
            icon={<Building2 size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-4 md:space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic information of the Hostel</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{selectedHostelDetail.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedHostelDetail.name}</InfoRow>
                            <InfoRow label={<><Home className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{selectedHostelDetail.hosteltype}</span></InfoRow>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Contact Information</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Contact information of the Hostel</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedHostelDetail.phone || 'N/A'}</InfoRow>
                            <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedHostelDetail.email || 'N/A'}</InfoRow>
                            <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Location</>}>{selectedHostelDetail.location || 'N/A'}</InfoRow>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Hostel Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{selectedHostelDetail.code}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedHostelDetail.name}</InfoRow>
                        <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{selectedHostelDetail.capacity}</InfoRow>
                        <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Occupancy</>}>{selectedHostelDetail.studentsCount || 0}</InfoRow>
                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                {selectedHostelDetail.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </InfoRow>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default HostelDetailView;
