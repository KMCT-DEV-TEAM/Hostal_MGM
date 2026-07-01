import React from 'react';
import { User, Mail, Phone, Building2, ToggleRight, Pencil } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

const AdminDetailView = ({ selectedAdminDetail, setView, openChangeEmailModal }) => {
    return (
        <Modal
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedAdminDetail?.name || 'Admin'}
            subtitle="Administrator Details"
            icon={<User size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Administrator</p>
                        <div className="space-y-1">
                            <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedAdminDetail?.name}</InfoRow>
                            <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>
                                <span className="flex items-center justify-between w-full">
                                    <span className="flex-1 break-all pr-2">{selectedAdminDetail?.email || 'N/A'}</span>
                                    <button
                                        onClick={() => openChangeEmailModal && openChangeEmailModal(selectedAdminDetail)}
                                        className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer shrink-0"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </span>
                            </InfoRow>
                            <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedAdminDetail?.phone ? `+91 ${selectedAdminDetail.phone}` : 'N/A'}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400 shrink-0" /> Organization</>}>{selectedAdminDetail?.organization?.name || selectedAdminDetail?.organization || 'N/A'}</InfoRow>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Admin Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedAdminDetail?.name}</InfoRow>
                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${selectedAdminDetail?.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                {selectedAdminDetail?.isActive ? "Active" : "Inactive"}
                            </span>
                        </InfoRow>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AdminDetailView;
